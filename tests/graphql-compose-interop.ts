import { test } from "./_support";
import { Injector, ReflectiveInjector } from "injection-js";
import { $field, $query } from "../src";
import { ObjectTypeComposer } from "graphql-compose";
import { graphql } from "graphql";

let injector: Injector = ReflectiveInjector.resolveAndCreate([
  {
    provide: ObjectTypeComposer,
    useFactory() {
      return ObjectTypeComposer.createTemp({
        name: "ObjectTypeComposer",
        fields: {
          x: {
            type: "String"
          }
        }
      });
    },
    deps: []
  }
]);

test("use string field types", async t => {
  class Thing {
    @$field(() => "String!") name: string;
    @$field(() => injector.get(ObjectTypeComposer)) something: object;
  }

  class Service {
    @$query(() => Thing) getThing(): Thing {
      return {
        name: "thing",
        something: {}
      };
    }
  }
  let tc = t.context.compose.getComposer(Thing);
  t.truthy(tc);
  let nameField = tc.getField("name");

  let result = await graphql(
    t.context.compose.mountInstances([new Service()]).buildSchema(),
    `
      {
        getThing {
          name
          something {
            x
          }
        }
      }
    `
  );

  t.falsy(result.errors);
});
