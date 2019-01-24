import 'reflect-metadata';
import {test} from "../src/ava";
import {$objectType, $field} from '../src';
import {schemaComposer, TypeComposer} from "graphql-compose";
import {$arg} from "../src/decorators/arg";
import {graphql} from "graphql";

test('create basic fields', t => {

    @$objectType()
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
    @$objectType()
    class User {
        @$field() a: string;
    }

    @$objectType()
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
    @$objectType()
    class A {
        @$field() a: string;
    }

    @$objectType()
    class B {
        @$field() a: A;
    }

    let composer = t.context.compose.getComposer(B);
    t.true(composer.hasField('a'));
    t.true(composer.getFieldTC('a').hasField('a'));
});
test('types should be connected by reference, not name', t => {
    @$objectType()
    class A {
        @$field() a: string;
    }

    let typeA2 = TypeComposer.create({name: 'A'});


    @$objectType()
    class B {
        @$field(() => typeA2) a;
    }

    @$objectType()
    class C {
        @$field(() => A) a;
    }

    const composeTsc = t.context.compose;

    t.false(composeTsc.getComposer(B).getFieldTC('a').hasField('a'));
    t.true(composeTsc.getComposer(C).getFieldTC('a').hasField('a'));
});

test('create field on class with arguments', async t => {
    @$objectType()
    class A {
        @$field()
        greet(@$arg('name') name: string): string {
            return 'hello ' + name;
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
        }
    }`);
    t.falsy(result.errors);
    t.is(result.data.geta.greet, 'hello Jan');


});