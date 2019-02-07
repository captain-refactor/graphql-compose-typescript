import {test} from "./_support";
import {$mount} from "../src/decorators/mount";
import {$field, $resolver} from "../src";
import {schemaComposer, SchemaComposer, TypeComposer} from "graphql-compose";
import {graphql, printSchema} from "graphql";

test('build simple schema', async t => {
    class ServiceA {
        @$resolver()
        @$mount(() => 'Query')
        getText(): string {
            return 'SUCCESS';
        }
    }

    const composer: SchemaComposer<any> = t.context.compose.mountInstances([new ServiceA()]);
    const result = await graphql(composer.buildSchema(), `{getText}`);
    t.falsy(result.errors);
    t.is(result.data.getText, 'SUCCESS');
});
test('query that returns object constructor', async t => {
    class User {
        @$field() name: string = 'Jan Kremen';
    }

    class UserService {

        @$mount(() => 'Query')
        @$resolver(() => User)
        user() {
            return new User();
        }
    }

    const service = new UserService();
    const composer = t.context.compose.mountInstances([service]);
    const result = await graphql(composer.buildSchema(), `{user{name}}`);
    t.falsy(result.errors);
    t.is(result.data.user.name, 'Jan Kremen');
});

test('mount resolver on object constructor', async t => {
    class User {
        @$field() name: string = 'Jan Kremen';
    }

    class UserService {
        @$mount(() => 'Query')
        @$resolver(() => User)
        user() {
            return new User();
        }

        @$mount(() => User)
        @$resolver()
        nameLength(): number {
            return 10;
        }
    }

    const service = new UserService();
    const composer = t.context.compose.mountInstances([service]);
    let schema = composer.buildSchema();
    const result = await graphql(schema, `{user{nameLength}}`);
    t.falsy(result.errors);
    t.is(result.data.user.nameLength, 10);
});

test('compose', async t => {
    let x = TypeComposer.create({
        name: 'User',
        fields: {
            name: 'String',
            age: 'Float',
            born: 'Date'
        }
    });
    schemaComposer.Query.addFields({
        user: {
            type: x,
            resolve() {
                return {
                    name: 'Jan K',
                    age: 15,
                }
            }
        }
    });
    t.pass();
});