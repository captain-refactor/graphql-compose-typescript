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

test('create enum from array', t =>{
  let values = ['a','b','c'];
  let enumTC = createEnum('State', values);
  t.deepEqual(enumTC.getFieldNames(), values);
  t.pass();
});
