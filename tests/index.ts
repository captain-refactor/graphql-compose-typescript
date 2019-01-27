import {$field, GraphqlComposeTypescript} from '../src';
import {Resolver, SchemaComposer, schemaComposer, TypeComposer} from "graphql-compose";
import {$arg} from "../src";
import {ExecutionResult, graphql, GraphQLError, GraphQLSchema, GraphQLString} from "graphql";
import {$resolver} from "../src";
import {ArrayTypeNotSpecified, isInstance, TypeNotSpecified} from "../src/graphq-compose-typescript";
import {ExecutionResultDataDefault} from "graphql/execution/execute";
import {ExecutionContext, TestInterface} from "ava";
import avaTest from "ava";
import {InstanceMissing} from "../src/decorators/resolver";

interface TestContext {
    compose: GraphqlComposeTypescript;
}

export const test: TestInterface<TestContext> = avaTest;

async function testResolver(t: ExecutionContext, resolver: Resolver, query?: string): Promise<ExecutionResult<ExecutionResultDataDefault>> {
    if (!query) query = `{test}`;

    function schemaForResolver(resolver: Resolver): GraphQLSchema {
        let schemaComposer = new SchemaComposer();
        schemaComposer.Query.setField('test', resolver);
        return schemaComposer.buildSchema();
    }

    return await graphql(schemaForResolver(resolver), query);
}

async function testResolverData(t: ExecutionContext, resolver: Resolver, query?: string): Promise<ExecutionResultDataDefault> {
    let result = await testResolver(t, resolver, query);
    t.falsy(result.errors);
    return result.data;
}

async function testResolverErrors(t: ExecutionContext, resolver: Resolver, query?: string): Promise<ReadonlyArray<GraphQLError>> {
    let result = await testResolver(t, resolver, query);
    t.truthy(result.errors, 'it should return errors');
    return result.errors;
}

test.beforeEach('provide testing functions', t => {
    t.context.compose = GraphqlComposeTypescript.create();
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
    let data = await testResolverData(t, resolver);
    t.is(data.test, 'SUCCESS');
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
    let data = await testResolverData(t, superOrderServiceComposer.getResolver('getOrder'),
        `{
            test{
                id
            }
        }`);
    t.is(data.test.id, '1');
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
    let data = await testResolverData(t, composer.getResolver('getAs'), `
    {
        test{
            field
        }
    }
    `);

    t.is(data.test.length, 2);
    t.deepEqual(data.test, [{field: 'value'}, {field: 'value'}]);
});

test('throw exception, when type is not specified', async t => {
    try {
        class Service {
            @$resolver()
            getX() {
                return 5;
            }
        }

        t.fail('it should trow');
    } catch (e) {
        t.true(e instanceof TypeNotSpecified)
    }

    try {
        class Service {
            @$resolver()
            async getX(): Promise<number> {
                return 5;
            }
        }

        t.fail('it should trow');
    } catch (e) {
        t.true(e instanceof TypeNotSpecified)
    }
});


test('array type not specified', async t => {
    try {
        class Service {
            @$resolver()
            getX(): number[] {
                return [1, 2, 3, 4];
            }
        }

        t.fail('it should trow');
    } catch (e) {
        t.true(e instanceof ArrayTypeNotSpecified);
    }
});

test('using class as input type', async t => {
    class Vector {
        @$field() x: number;
        @$field() y: number;
    }

    class Service {
        @$resolver(() => Vector)
        saveVector(@$arg('vector')vector: Vector) {
            return vector;
        }
    }

    let data = await testResolverData(t, t.context.compose.getComposer(new Service()).getResolver('saveVector'), `
    {
        test(vector: {x: 1, y: 15}){
            x
            y        
        }
    }
    `);
    t.deepEqual(data.test, {x: 1, y: 15});
});

test('throw on trying using resolver without instance', async t => {
    class Service {
        @$resolver()
        test(): string {
            return '';
        }
    }

    let errors = await testResolverErrors(t, t.context.compose.getComposer(Service).getResolver('test'));
    t.is(errors[0].message, 'Missing instance for Service.');

});


test('array return type', async t => {
    class Service {
        @$field(() => [String])
        getNames(): string[] {
            return ['js', 'ts'];
        }
    }

    let result = await testResolverData(t, t.context.compose.getComposer(new Service()).getResolver('getNames'));
    t.deepEqual(result.test, ['js', 'ts']);
});
