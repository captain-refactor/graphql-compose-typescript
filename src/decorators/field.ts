import { OutputTypeFn } from "../graphq-compose-typescript";
import { getConstructor, StringKey } from "../utils";
import { FieldSpecKeeper } from "../field-spec";

let fsk = new FieldSpecKeeper();

export function $field(typeFn?: OutputTypeFn): PropertyDecorator {
  return <T>(prototype: T, propertyName: StringKey<T>) => {
    const constructor = getConstructor(prototype);
    fsk.setTypeSpec(constructor, propertyName, typeFn);
  };
}
