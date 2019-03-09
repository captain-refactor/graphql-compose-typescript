import {
  InputTypeComposer,
  SchemaComposer,
  TypeComposer
} from "graphql-compose";
import { FieldSpecKeeper } from "../field-spec";
import { FieldCreator } from "./field-creators";
import { ClassType, OutputTypeFn } from "../graphq-compose-typescript";

export class ComposerBuilder<C extends InputTypeComposer | TypeComposer> {
  constructor(
    protected fieldSpec: FieldSpecKeeper,
    protected schemaComposer: SchemaComposer<any>,
    protected fieldCreator: FieldCreator
  ) {}

  private createFields<T>(constructor: ClassType<T>) {
    let fields: any = {};
    for (const [key, typeFn] of this.fieldSpec.getFieldTypes(constructor)) {
      fields[key] = this.fieldCreator.createField(
        constructor,
        typeFn as OutputTypeFn,
        key
      );
    }
    return fields;
  }

  build<T>(constructor: ClassType<T>, composer: C) {
    if (!this.fieldSpec.isDecorated(constructor)) return null;
    let fields: any = this.createFields(constructor);
    // @ts-ignore
    composer.addFields(fields);
  }
}
