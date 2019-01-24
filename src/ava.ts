import avaTest, {TestInterface} from 'ava';
import {GraphqlComposeTypescript} from "./graphq-compose-typescript";

interface TestContext {
    compose: GraphqlComposeTypescript;
}

export const test: TestInterface<TestContext> = avaTest;


test.beforeEach(t => {
    t.context.compose = GraphqlComposeTypescript.create();
});