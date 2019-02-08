import {GraphqlComposeTypescript} from "../src";
import {TestInterface} from "ava";
import avaTest from "ava";
import {promisify} from "util";
import {SchemaComposer} from "graphql-compose";

export interface TestContext {
    compose: GraphqlComposeTypescript;
    schemaComposer: SchemaComposer<any>;
}

export const test: TestInterface<TestContext> = avaTest;

test.beforeEach('provide testing functions', t => {
    const schemaComposer = new SchemaComposer<any>();
    t.context.schemaComposer = schemaComposer;
    t.context.compose = GraphqlComposeTypescript.create(schemaComposer);
});

export const sleep = promisify(setTimeout);
