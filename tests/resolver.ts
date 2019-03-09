import { $arg, $field, $mutation, $query, $resolver } from "../src";
import {
  Resolver,
  schemaComposer,
  SchemaComposer,
  TypeComposer
} from "graphql-compose";
import {
  ExecutionResult,
  graphql,
  GraphQLError,
  GraphQLSchema,
  GraphQLString
} from "graphql";
import {
  ArrayTypeNotSpecified,
  TypeNotSpecified
} from "../src/graphq-compose-typescript";
import { ExecutionResultDataDefault } from "graphql/execution/execute";
import { ExecutionContext } from "ava";
import { test } from "./_support";
import { $input } from "../src/decorators/input";
import { $wrap } from "../src/decorators/wrap";

async function testResolver(
  t: ExecutionContext,
  resolver: Resolver,
  query?: string
): Promise<ExecutionResult<ExecutionResultDataDefault>> {
  if (!query) query = `{test}`;

  function schemaForResolver(resolver: Resolver): GraphQLSchema {
    let schemaComposer = new SchemaComposer();
    schemaComposer.Query.setField("test", resolver);
    return schemaComposer.buildSchema();
  }

  return await graphql(schemaForResolver(resolver), query);
}

async function testResolverData(
  t: ExecutionContext,
  resolver: Resolver,
  query?: string
): Promise<ExecutionResultDataDefault> {
  let result = await testResolver(t, resolver, query);
  t.falsy(result.errors);
  return result.data;
}

async function testResolverErrors(
  t: ExecutionContext,
  resolver: Resolver,
  query?: string
): Promise<ReadonlyArray<GraphQLError>> {
  let result = await testResolver(t, resolver, query);
  t.truthy(result.errors, "it should return errors");
  return result.errors;
}

test("how does resolve work", async t => {
  class A {
    constructor(public value: string) {}

    @$resolver()
    method(): string {
      return this.value;
    }
  }

  let instance = new A("SUCCESS");

  let resolver = t.context.compose.getResolver(instance, "method");
  t.is(resolver.getType(), GraphQLString);
  let data = await testResolverData(t, resolver);
  t.is(data.test, "SUCCESS");
});

test("inheritance", t => {
  class A {
    @$resolver()
    get5(): number {
      return 5;
    }
  }

  class B extends A {
    @$resolver()
    get6(): number {
      return 6;
    }
  }

  let a = new A();
  let b = new B();
  t.truthy(t.context.compose.getResolver(a, "get5"));
  t.throws(() => t.context.compose.getResolver(a, "get6" as any));

  t.truthy(t.context.compose.getResolver(b, "get5"));
  t.truthy(t.context.compose.getResolver(b, "get6"));
});

test("sample app with multiple types and so on", async t => {
  class Order {
    @$field() id: string;
    @$field() createdOn: Date;

    constructor(id: string) {
      this.id = id;
      this.createdOn = new Date();
    }
  }

  class OrderService {
    constructor(private items: Map<string, Order>) {}

    @$resolver(() => Order)
    getOrders(): Order[] {
      let orders = [];
      for (let order of this.items.values()) orders.push(order);
      return orders;
    }

    @$resolver()
    addOrder(order: Order): Order {
      this.items.set(order.id, order);
      return order;
    }
  }

  class SuperOrderService extends OrderService {
    @$resolver(() => Order)
    async getOrder(): Promise<Order> {
      return new Order("1");
    }
  }

  const superOrderService = new SuperOrderService(new Map());
  let data = await testResolverData(
    t,
    t.context.compose.getResolver(superOrderService, "getOrder"),
    `{
            test{
                id
            }
        }`
  );
  t.is(data.test.id, "1");
});

test("problem with constructor providen constructor [ClassType]", async t => {
  class A {
    @$field()
    field: string = "value";
  }

  class Service {
    @$resolver(() => [A])
    getAs() {
      return [new A(), new A()];
    }
  }

  let resolver = t.context.compose.getResolver(new Service(), "getAs");
  let data = await testResolverData(
    t,
    resolver,
    `
    {
        test{
            field
        }
    }
    `
  );

  t.is(data.test.length, 2);
  t.deepEqual(data.test, [{ field: "value" }, { field: "value" }]);
});

test("throw exception, when constructor is not specified", async t => {
  try {
    class Service {
      @$resolver()
      getX() {
        return 5;
      }
    }

    t.context.compose.getResolver(new Service(), "getX");
    t.fail("it should trow");
  } catch (e) {
    t.true(e instanceof TypeNotSpecified);
  }

  try {
    class Service {
      @$resolver()
      async getX(): Promise<number> {
        return 5;
      }
    }

    t.context.compose.getResolver(new Service(), "getX");
    t.fail("it should trow");
  } catch (e) {
    t.true(e instanceof TypeNotSpecified);
  }
});

test("array constructor not specified", async t => {
  try {
    class Service {
      @$resolver()
      getX(): number[] {
        return [1, 2, 3, 4];
      }
    }

    t.context.compose.getResolver(new Service(), "getX");
    t.fail("it should trow");
  } catch (e) {
    t.true(e instanceof ArrayTypeNotSpecified);
  }
});

test("using class as input type", async t => {
  class Vector {
    @$field() x: number;
    @$field() y: number;
  }

  class Service {
    @$resolver(() => Vector)
    saveVector(@$arg("vector") vector: Vector) {
      return vector;
    }
  }

  let data = await testResolverData(
    t,
    t.context.compose.getResolver(new Service(), "saveVector"),
    `
    {
        test(vector: {x: 1, y: 15}){
            x
            y        
        }
    }
    `
  );
  t.deepEqual(data.test, { x: 1, y: 15 });
});

test("array return constructor", async t => {
  class Service {
    @$resolver(() => [String])
    getNames(): string[] {
      return ["js", "ts"];
    }
  }

  let resolver = t.context.compose.getResolver(new Service(), "getNames");
  t.truthy(resolver);
  let result = await testResolverData(t, resolver);
  t.deepEqual(result.test, ["js", "ts"]);
});

test("resolve method field even on plain objects", async t => {
  class Person {
    @$field() name: string;
    @$field() surname: string;

    @$field() wholeName(): string {
      return `${this.name} ${this.surname}`;
    }
  }

  class Service {
    @$resolver(() => Person)
    person() {
      return {
        name: "Jan",
        surname: "Kremeň"
      };
    }
  }

  let result = await testResolverData(
    t,
    t.context.compose.getResolver(new Service(), "person"),
    `{test{wholeName}}`
  );

  t.deepEqual(result, {
    test: {
      wholeName: "Jan Kremeň"
    }
  });
});

test("use type composer type", async t => {
  const BookTC = t.context.schemaComposer.TypeComposer.create({
    name: "Book",
    fields: {
      pagesCount: "Int",
      name: "String"
    }
  });

  const BookITC = BookTC.getInputTypeComposer();

  class BookService {
    @$resolver(() => BookTC)
    findBook(@$arg("book", () => BookITC) book) {
      return book;
    }
  }

  let result = await testResolverData(
    t,
    t.context.compose.getResolver(new BookService(), "findBook"),
    `{
        test(book: {name:"abcd", pagesCount: 297}){
            name 
            pagesCount
            }
        }`
  );
  t.is(result.test.name, "abcd");
});

test("array input type property on mutation resolver", async t => {
  @$input()
  class Form {
    @$field(() => "String")
    favoriteThings: string[];
  }

  class FormService {
    @$mutation()
    submitForm(@$arg("form") form: Form): string {
      return "Thank you for your submission";
    }

    @$query()
    hello(): string {
      return "there must be at least one query";
    }
  }

  const schema = t.context.compose
    .mountInstances([new FormService()])
    .buildSchema();
  let result = await graphql(
    schema,
    `
      mutation {
        submitForm(form: { favoriteThings: ["a", "b", "c"] })
      }
    `
  );
  t.falsy(result.errors);
  t.is(result.data.submitForm, "Thank you for your submission");
});

test("wrap resolver", async t => {
  class FormService {
    @$query()
    @$wrap(r => r.setResolve(() => "SUCCESS"))
    hello(): string {
      return "FAIL";
    }
  }

  let schema = t.context.compose
    .mountInstances([new FormService()])
    .buildSchema();
  let result = await graphql(
    schema,
    `
      {
        hello
      }
    `
  );
  t.pass();
  t.is(result.data.hello, 'SUCCESS');
});
