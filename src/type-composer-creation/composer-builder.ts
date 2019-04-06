import {
  InputTypeComposer,
  SchemaComposer,
  ObjectTypeComposer
} from "graphql-compose";
import { FieldSpecKeeper } from "../field-spec";
import { FieldCreator } from "./field-creators";
import { ClassType, OutputTypeFn } from "../graphq-compose-typescript";
import { WrapComposerSpecKeeper } from "./wrap-composer-spec-keeper";

export class ComposerBuilder<C extends InputTypeComposer | ObjectTypeComposer> {
  constructor(
    protected fieldSpec: FieldSpecKeeper,
    protected schemaComposer: SchemaComposer<any>,
    protected fieldCreator: FieldCreator,
    protected wrapComposerSpecKeeper: WrapComposerSpecKeeper
  ) {
  }

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
    for (let wrapper of this.wrapComposerSpecKeeper.getWrappers(constructor)) {
      composer = wrapper(composer) as any;
    }
  }
}
