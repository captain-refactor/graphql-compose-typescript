import { test } from "./_support";
import { $query } from "../src";
import { $ctx } from "../src/decorators/context";
import { graphql } from "graphql";

test("use context", async t => {
  class Service {
    @$query()
    helloContext(@$ctx() context): string {
      return `Hello ${context.name}`;
    }
  }

  const schemaComposer = t.context.compose.mountInstances([new Service()]);
  const schema = schemaComposer.buildSchema();
  const result = await graphql({
    schema,
    source: `{
            helloContext        
        }`,
    contextValue: { name: "User" }
  });
  t.falsy(result.errors);
  t.is(result.data.helloContext, "Hello User");
});
