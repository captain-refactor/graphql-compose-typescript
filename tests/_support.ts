import {GraphqlComposeTypescript} from "../src";
import {TestInterface} from "ava";
import avaTest from "ava";
import {promisify} from "util";
import {SchemaComposer} from "graphql-compose";

export interface TestContext {
    compose: GraphqlComposeTypescript;
}

export const test: TestInterface<TestContext> = avaTest;

test.beforeEach('provide testing functions', t => {
    t.context.compose = GraphqlComposeTypescript.create(new SchemaComposer<any>());
});

export const sleep = promisify(setTimeout);
