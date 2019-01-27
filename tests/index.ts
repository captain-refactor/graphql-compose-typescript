import {$field, GraphqlComposeTypescript} from '../src';
import {Resolver, SchemaComposer, schemaComposer, TypeComposer} from "graphql-compose";
import {$arg} from "../src";
import {ExecutionResult, graphql, GraphQLSchema, GraphQLString} from "graphql";
import {$resolver} from "../src";
import {isInstance, TypeNotSpecified} from "../src/graphq-compose-typescript";
import {ExecutionResultDataDefault} from "graphql/execution/execute";
import {TestInterface} from "ava";
import avaTest from "ava";

interface TestContext {
    compose: GraphqlComposeTypescript;

    testResolver(resolver: Resolver, query?: string): Promise<ExecutionResult<ExecutionResultDataDefault>>
}

export const test: TestInterface<TestContext> = avaTest;


test.beforeEach('provide testing functions',t => {
    t.context.compose = GraphqlComposeTypescript.create();
    t.context.testResolver = async (resolver: Resolver, query?: string): Promise<ExecutionResult<ExecutionResultDataDefault>> => {
        if (!query) query = `{test}`;

        function schemaForResolver(resolver: Resolver): GraphQLSchema {
            let schemaComposer = new SchemaComposer();
            schemaComposer.Query.setField('test', resolver);
            return schemaComposer.buildSchema();
        }

        let result = await graphql(schemaForResolver(resolver), query);
        t.falsy(result.errors);
        return result;
    }
});

test('create basic fields', t => {

    class User {
        @$field() a: string;
        @$field() b: number;
    }

    let composer = t.context.compose.getComposer(User);
    t.true(composer.hasField('a'));
    t.is(composer.getFieldType('a').toString(), 'String');
    t.true(composer.hasField('b'));
    t.is(composer.getFieldType('b').toString(), 'Float');
});

test('create inherited object type', t => {
    class User {
        @$field() a: string;
    }

    class SuperUser extends User {
        @$field() b: number;
    }

    let userComposer = t.context.compose.getComposer(User);
    t.false(userComposer.hasField('b'));
    let superUserComposer = t.context.compose.getComposer(SuperUser);
    t.true(superUserComposer.hasField('a'));
    t.true(superUserComposer.hasField('b'));
});
test('compose type using other classes', t => {
    class A {
        @$field() a: string;
    }

    class B {
        @$field() a: A;
    }

    let composer = t.context.compose.getComposer(B);
    t.true(composer.hasField('a'));
    t.true(composer.getFieldTC('a').hasField('a'));
});

test('types should be connected by reference, not name', t => {
    class A {
        @$field() a: string;
    }

    let typeA2 = TypeComposer.create({name: 'A'});


    class B {
        @$field(() => typeA2) a;
    }

    class C {
        @$field(() => A) a;
    }

    const composeTsc = t.context.compose;

    t.false(composeTsc.getComposer(B).getFieldTC('a').hasField('a'));
    t.true(composeTsc.getComposer(C).getFieldTC('a').hasField('a'));
});

test('create field on class with arguments', async t => {
    class A {
        @$field()
        greet(@$arg('name') name: string): string {
            return 'hello ' + name;
        }

        @$field()
        sayHello(): string {
            return 'hello';
        }
    }

    let typeComposer = t.context.compose.getComposer(A);

    schemaComposer.Query.addFields({
        geta: {
            type: typeComposer.getType(),
            resolve() {
                return new A();
            }
        }
    });
    let schema = schemaComposer.buildSchema();
    let result = await graphql(schema, `{
        geta{
            greet(name: "Jan")
            sayHello
        }
    }`);
    t.falsy(result.errors);
    t.is(result.data.geta.greet, 'hello Jan');
    t.is(result.data.geta.sayHello, 'hello');
});

test('how does resolve work', async t => {
    class A {
        constructor(public value: string) {
        }

        @$resolver()
        method(): string {
            return this.value;
        }
    }

    let instance = new A('SUCCESS');
    let composer = t.context.compose.getComposer(instance);
    t.truthy(composer);
    t.true(composer.hasResolver('method'));
    let resolver = composer.getResolver('method');
    t.is(resolver.getType(), GraphQLString);
    let queryResult = await t.context.testResolver(resolver);
    t.is(queryResult.data.test, 'SUCCESS');
});


test('isInstance function', t => {
    class A {
    }

    t.false(isInstance(A));
    t.false(isInstance(Object));
    t.false(isInstance(Date));
    t.true(isInstance(new A));
    t.true(isInstance({}));
    t.true(isInstance(new Date));
});

test('inheritance', t => {
    class A {
        @$field()
        x: boolean;

        @$resolver()
        get5(): number {
            return 5;
        }
    }

    class B extends A {
        @$field()
        y: boolean;

        @$resolver()
        get6(): number {
            return 6;
        }
    }

    let AComposer = t.context.compose.getComposer(A);
    t.true(AComposer.hasField('x'));
    t.false(AComposer.hasField('y'));

    let BComposer = t.context.compose.getComposer(B);
    t.true(BComposer.hasField('x'));
    t.true(BComposer.hasField('y'));

    let a = new A;
    let b = new B;
    let aComposer = t.context.compose.getComposer(a);
    t.true(aComposer.hasResolver('get5'));
    t.false(aComposer.hasResolver('get6'));

    let bComposer = t.context.compose.getComposer(b);
    t.true(bComposer.hasResolver('get5'));
    t.true(bComposer.hasResolver('get6'));
});

test('sample app with multiple types and so on', async t => {
    class Order {
        @$field() id: string;
        @$field() createdOn: Date;

        constructor(id: string) {
            this.id = id;
            this.createdOn = new Date();
        }
    }

    class OrderService {
        constructor(private items: Map<string, Order>) {
        }

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
            return new Order('1');
        }
    }

    const superOrderService = new SuperOrderService(new Map());
    const superOrderServiceComposer = t.context.compose.getComposer(superOrderService);
    t.true(superOrderServiceComposer.hasResolver('getOrder'));
    let result = await t.context.testResolver(superOrderServiceComposer.getResolver('getOrder'),
        `{
            test{
                id
            }
        }`);
    t.falsy(result.errors);
    t.is(result.data.test.id, '1');
});

test('problem with type providen type [ClassType]', async t => {
    class A {
        @$field()
        field: string = 'value';
    }

    class Service {
        @$resolver(() => [A])
        getAs() {
            return [new A, new A];
        }
    }

    let composer = t.context.compose.getComposer(new Service());
    let result = await t.context.testResolver(composer.getResolver('getAs'), `
    {
        test{
            field
        }
    }
    `);

    t.is(result.data.test.length, 2);
    t.deepEqual(result.data.test, [{field: 'value'}, {field: 'value'}]);
});

test('throw exception, when type is not specified', async t => {
    try {
        class Service {
            @$resolver()
            getX() {
                return 5;
            }
        }
        t.fail('it shoudl trow');
    }catch (e) {
        t.true(e instanceof TypeNotSpecified)
    }
});
