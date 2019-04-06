import {
  InputTypeComposer,
  SchemaComposer,
  ObjectTypeComposer,
  EnumTypeComposer
} from "graphql-compose";
import { TypeNameKeeper } from "../type-name";
import { ClassSpecialist, ClassType } from "../graphq-compose-typescript";
import { ComposerBuilder } from "./composer-builder";
import { ProvidenTypeSingular } from "./queue";
import { GraphqlComposeTypescriptError } from "../error";
import { isEnumType } from "graphql";

export class ComposerCreator {
  constructor(
    protected outputCreator: ComposerInstanceCreator<ObjectTypeComposer>,
    protected inputCreator: ComposerInstanceCreator<InputTypeComposer>,
    protected outputBuilder: ComposerBuilder<ObjectTypeComposer>,
    protected inputBuilder: ComposerBuilder<InputTypeComposer>
  ) {}

  createTypeComposer<T>(constructor: ClassType<T>): ObjectTypeComposer<T> {
    const composer = this.outputCreator.create(constructor);
    this.outputBuilder.build(constructor, composer);
    return composer;
  }

  createInputTypeComposer(constructor: ClassType): InputTypeComposer {
    const composer = this.inputCreator.create(constructor);
    this.inputBuilder.build(constructor, composer);
    return composer;
  }
}

export interface ComposerInstanceCreator<
  C extends ObjectTypeComposer | InputTypeComposer | EnumTypeComposer
> {
  create(type: ProvidenTypeSingular): C;

  createFromString(text: string): C;
}

function isTypeComposer(
  type: ProvidenTypeSingular
): type is ObjectTypeComposer {
  return (
    !!(type as InputTypeComposer).getType &&
    !!(type as ObjectTypeComposer).getInputTypeComposer
  );
}

function isInputTypeComposer(
  type: ProvidenTypeSingular
): type is InputTypeComposer {
  return (
    !!(type as InputTypeComposer).getType &&
    !(type as ObjectTypeComposer).getInputTypeComposer
  );
}

export class InputComposerCreator
  implements ComposerInstanceCreator<InputTypeComposer> {
  constructor(
    protected schemaComposer: SchemaComposer<any>,
    protected nameKeeper: TypeNameKeeper,
    protected classSpecialist: ClassSpecialist
  ) {}

  create(type: ProvidenTypeSingular): InputTypeComposer {
    if (this.classSpecialist.isClassType(type)) {
      return this.schemaComposer.createInputTC({
        name: this.nameKeeper.getInputTypeName(type),
        fields: undefined
      });
    } else if (isInputTypeComposer(type)) {
      return type;
    } else if (isTypeComposer(type)) {
      return type.getInputTypeComposer();
    } else {
      return this.schemaComposer.createInputTC(type as any);
    }
  }

  createFromString(text: string): InputTypeComposer {
    return this.schemaComposer.createInputTC(text);
  }
}

export class CannotCreateTypeComposerFromITC extends GraphqlComposeTypescriptError {
  constructor(itc: InputTypeComposer) {
    super(
      `Cannot create TypeComposer from InputTypeComposer: ${itc.getTypeName()}`
    );
  }
}

export class OutputComposerCreator
  implements ComposerInstanceCreator<ObjectTypeComposer | EnumTypeComposer> {
  constructor(
    protected schemaComposer: SchemaComposer<any>,
    protected nameKeeper: TypeNameKeeper,
    protected classSpecialist: ClassSpecialist
  ) {}

  create(type: ProvidenTypeSingular): ObjectTypeComposer {
    if (this.classSpecialist.isClassType(type)) {
      return this.schemaComposer.createObjectTC({
        name: this.nameKeeper.getTypeName(type)
      });
    } else {
      return type as any;
      // return this.schemaComposer.createObjectTC(type);
    }
  }

  createFromString(text: string): ObjectTypeComposer {
    return this.schemaComposer.createObjectTC(text);
  }
}
