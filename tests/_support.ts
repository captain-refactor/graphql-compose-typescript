import {GraphqlComposeTypescript} from "../src";
import {TestInterface} from "ava";
import avaTest from "ava";

export interface TestContext {
    compose: GraphqlComposeTypescript;
}

export const test: TestInterface<TestContext> = avaTest;

test.beforeEach('provide testing functions', t => {
    t.context.compose = GraphqlComposeTypescript.create();
});
