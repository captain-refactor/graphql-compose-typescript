import {
  ClassSpecialist,
  ClassType,
  ProvidenType
} from "./graphq-compose-typescript";
import { FieldSpecKeeper } from "./field-spec";
import {
  BaseQueue,
  ProvidenTypeSingular
} from "./type-composer-creation/queue";
import { ComposerInstanceCreator } from "./type-composer-creation/composer-creator";
import { IOComposers, isString } from "./utils";
import {
  ComposeInputType,
  ComposeOutputType,
  SchemaComposer,
  TypeMapper
} from "graphql-compose";

export type ComposeType = ComposeInputType | ComposeOutputType<any, any>;
export type ComposerIn<T extends ComposeType> = Extract<IOComposers, T>;

export class ProvidenTypeConvertor<
  T extends ComposeType,
  C extends ComposerIn<T> = ComposerIn<T>
> {
  constructor(
    protected classSpec: ClassSpecialist,
    protected fieldSpec: FieldSpecKeeper,
    protected queue: BaseQueue<C>,
    protected creator: ComposerInstanceCreator<C>,
    protected schemaComposer: SchemaComposer<any>
  ) {}

  private get typeMapper(): TypeMapper<any> {
    return (this.schemaComposer as any).typeMapper;
  }

  toComposeType(type: ProvidenType): T {
    if (!type) return null;
    if (this.classSpec.isClassType(type)) {
      return this.classToComposeType(type);
    } else if (Array.isArray(type)) {
      return [this.toComposeType(type[0])] as any;
    } else if (isString(type) && this.typeMapper.get(type)) {
      return this.typeMapper.get(type) as any;
    } else {
      return this.queue.add(type as ProvidenTypeSingular);
    }
  }

  classToComposeType(typeClass: ClassType): T {
    if (!typeClass) return null;
    if (typeClass === String) {
      return "String" as any;
    } else if (typeClass === Date) {
      return "Date" as any;
    } else if (typeClass === Number) {
      return "Float" as any;
    } else if (this.fieldSpec.isDecorated(typeClass)) {
      return this.queue.add(typeClass);
    } else {
      return this.creator.createFromString(typeClass.name);
    }
  }
}
