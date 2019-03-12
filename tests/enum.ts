import { test } from "./_support";
import { createEnum } from "../src/enum/create";

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
