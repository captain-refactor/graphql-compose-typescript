import { test } from "./_support";
import { $mount } from "../src/decorators/mount";
import { $arg, $field, $query, $resolver } from "../src";
import {
  schemaComposer,
  SchemaComposer,
  ObjectTypeComposer,
  ComposeFieldConfig,
  ComposeFieldConfigAsObject
} from "graphql-compose";
import { graphql } from "graphql";
import { $input } from "../src/decorators/input";
import { MountPointIsNull } from "../src";
import {
  ArrayTypeNotSpecified,
  TypeNotSpecified
} from "../src/graphq-compose-typescript";
import { $source } from "../src/decorators/source";
import { InvalidMountPoint } from "../src/mounting/mounter";
import { $extendField } from "../src/decorators/extend-field";

test("build simple schema", async t => {
  class ServiceA {
    @$resolver()
    @$mount(() => "Query")
    getText(): string {
      return "SUCCESS";
    }
  }

  const composer: SchemaComposer<any> = t.context.compose.mountInstances([
    new ServiceA()
  ]);
  const result = await graphql(
    composer.buildSchema(),
    `
      {
        getText
      }
    `
  );
  t.falsy(result.errors);
  t.is(result.data.getText, "SUCCESS");
});

test("query that returns object constructor", async t => {
  class User {
    @$field() name: string = "Jan Kremen";
  }

  class UserService {
    @$mount(() => "Query")
    @$resolver(() => User)
    user() {
      return new User();
    }
  }

  const service = new UserService();
  const composer = t.context.compose.mountInstances([service]);
  const result = await graphql(
    composer.buildSchema(),
    `
      {
        user {
          name
        }
      }
    `
  );
  t.falsy(result.errors);
  t.is(result.data.user.name, "Jan Kremen");
});

test("mount resolver on object constructor", async t => {
  class User {
    @$field() name: string = "Jan Kremen";
  }

  class UserService {
    @$mount(() => "Query")
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
  const result = await graphql(
    schema,
    `
      {
        user {
          nameLength
        }
      }
    `
  );
  t.falsy(result.errors);
  t.is(result.data.user.nameLength, 10);
});

test("compose", async t => {
  let x = ObjectTypeComposer.createTemp({
    name: "User",
    fields: {
      name: "String",
      age: "Float",
      born: "Date"
    }
  });
  schemaComposer.Query.addFields({
    user: {
      type: x,
      resolve() {
        return {
          name: "Jan K",
          age: 15
        };
      }
    }
  });
  t.pass();
});

test("using same recursive type multiple times", async t => {
  class Thing {
    @$field() x: string;
    @$field() innerThing?: Thing;
  }

  class Service {
    @$query()
    mine(@$arg("thing") thing: Thing): Thing {
      return {
        x: "Renault"
      };
    }

    @$query()
    yours(@$arg("thing") thing: Thing): Thing {
      return {
        x: "abcv"
      };
    }
  }

  t.context.compose.mountInstances([new Service()]);
  t.context.compose.schemaComposer.buildSchema();
  t.pass();
});

test("mount point is null", async t => {
  class Service {
    @$resolver()
    @$mount(() => null)
    yours(thing: string): string {
      return "abcv";
    }
  }

  try {
    t.context.compose.mountInstances([new Service()]);
    t.fail();
  } catch (e) {
    t.true(e instanceof MountPointIsNull);
  }
});
test("array input type", async t => {
  @$input()
  class SearchCriteria {
    @$field() text: string;
    @$field() min: number;
    @$field() max: number;
  }

  class Service {
    @$query()
    search(
      @$arg("criteria", () => SearchCriteria) criteria: SearchCriteria[]
    ): string {
      return JSON.stringify(criteria);
    }

    @$query()
    search2(
      @$arg("criteria", () => [SearchCriteria]) criteria: SearchCriteria[]
    ): string {
      return JSON.stringify(criteria);
    }
  }

  const schema = t.context.compose
    .mountInstances([new Service()])
    .buildSchema();
  let result = await graphql(
    schema,
    `
      {
        search(criteria: [{ text: "Hello" }])
      }
    `
  );
  t.falsy(result.errors);
  result = await graphql(
    schema,
    `
      {
        search2(criteria: [{ text: "Hello" }])
      }
    `
  );
  t.falsy(result.errors);
});

test("argument array type not specified", async t => {
  class Service {
    @$query()
    search(@$arg("criteria") criteria: any[]): string {
      return JSON.stringify(criteria);
    }
  }

  try {
    t.context.compose.mountInstances([new Service()]).buildSchema();
  } catch (e) {
    t.true(e instanceof ArrayTypeNotSpecified);
  }
});

test("invalid mount point", async t => {
  class Service {
    @$mount(() => [])
    @$resolver()
    hello(): string {
      return "hello";
    }
  }

  try {
    t.context.compose.mountInstances([new Service()]);
    t.fail();
  } catch (e) {
    t.true(e instanceof InvalidMountPoint);
  }
});

test("type not specified", t => {
  class Service {
    @$query()
    hello() {
      return "hello";
    }
  }

  try {
    t.context.compose.mountInstances([new Service()]);
    t.fail();
  } catch (e) {
    t.true(e instanceof TypeNotSpecified);
  }
});
test("source parameter", async t => {
  class User {
    @$field() name: string;
    @$field() surname: string;
  }

  class Service {
    @$resolver()
    @$mount(() => User)
    fullName(@$source() user: User): string {
      return `${user.name} ${user.surname}`;
    }

    @$query()
    getUser(): User {
      return {
        name: "Jan",
        surname: "Kremen"
      };
    }
  }

  let schema = t.context.compose.mountInstances([new Service()]).buildSchema();
  let result = await graphql(
    schema,
    `
      {
        getUser {
          fullName
        }
      }
    `
  );
  t.falsy(result.errors);
  t.is(result.data.getUser.fullName, "Jan Kremen");
});
test("wrap field", async t => {
  class User {
    @$field()
    @$extendField({ type: "Boolean" })
    name: string;
  }
  const field: ComposeFieldConfigAsObject<
    any,
    any
  > = t.context.compose.getComposer(User).getField("name") as any;
  t.is(field.type, "Boolean");
});
