import {test} from "./_support";
import {$mount} from "../src/decorators/mount";
import {$field, $resolver} from "../src";
import {SchemaComposer} from "graphql-compose";
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
test('query that returns object type', async t => {
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

test('mount resolver on object type', async t => {
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
    t.log(printSchema(schema));
    const result = await graphql(schema, `{user{nameLength}}`);
    t.falsy(result.errors);
    t.is(result.data.user.nameLength, 10);
});
