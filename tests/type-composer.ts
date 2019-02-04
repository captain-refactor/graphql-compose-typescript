import {sleep, test} from "./_support";
import {$arg, $field, $resolver} from "../src";
import {schemaComposer, TypeComposer} from "graphql-compose";
import {graphql} from "graphql";

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

test('inheritance', t => {
    class A {
        @$field()
        x: boolean;
    }

    class B extends A {
        @$field()
        y: boolean;
    }

    let AComposer = t.context.compose.getComposer(A);
    t.true(AComposer.hasField('x'));
    t.false(AComposer.hasField('y'));

    let BComposer = t.context.compose.getComposer(B);
    t.true(BComposer.hasField('x'));
    t.true(BComposer.hasField('y'));
});
