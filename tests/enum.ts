import { test } from "./_support";
import { createEnum } from "../src";
import { $field } from "../src";

test("create enum type", t => {
  enum State {
    "to-do",
    "in-progress",
    "done"
  }
  let enumTC = createEnum("State", State);
  t.deepEqual(enumTC.getFieldNames(), ["to-do", "in-progress", "done"]);
  t.is(enumTC.getField("to-do").value, "0");
  t.pass();
});

test("create enum from array", t => {
  let values = ["a", "b", "c"];
  let enumTC = createEnum("State", values);
  t.deepEqual(enumTC.getFieldNames(), values);
  t.pass();
});

test("use enum in object type", async t => {
  type DatabaseStatus = "active" | "to-create" | "to-destroy";
  const DatabaseStatuses = ["active", "to-create", "to-destroy"];
  const DatabaseStatusTC = createEnum("DatabaseStatus", DatabaseStatuses);

  class ArangoDatabase {
    @$field() _key: string;
    @$field() userKey: string;
    @$field() name: string;
    @$field() url: string;
    @$field(() => DatabaseStatusTC) status: DatabaseStatus;
  }

  let statusField = t.context.compose
    .getComposer(ArangoDatabase)
    .getField("status");
  t.truthy(statusField);
});
