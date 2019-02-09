import {InputTypeComposer, SchemaComposer, TypeComposer} from "graphql-compose";
import {TypeNameKeeper} from "../type-name";
import {ClassSpecialist, ClassType} from "../graphq-compose-typescript";
import {ComposerBuilder} from "./composer-builder";
import {ProvidenTypeSingular} from "./queue";
import {GraphqlComposeTypescriptError} from "../error";

export class ComposerCreator {
    constructor(protected outputCreator: ComposerInstanceCreator<TypeComposer>,
                protected inputCreator: ComposerInstanceCreator<InputTypeComposer>,
                protected outputBuilder: ComposerBuilder<TypeComposer>,
                protected inputBuilder: ComposerBuilder<InputTypeComposer>) {
    }

    createTypeComposer<T>(constructor: ClassType<T>): TypeComposer<T> {
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

export interface ComposerInstanceCreator<C extends TypeComposer | InputTypeComposer> {
    create(type: ProvidenTypeSingular): C;

    createFromString(text: string): C;
}

function isTypeComposer(type: ProvidenTypeSingular): type is TypeComposer {
    return !!(type as InputTypeComposer).getType && !!(type as TypeComposer).getInputTypeComposer
}

function isInputTypeComposer(type: ProvidenTypeSingular): type is InputTypeComposer {
    return !!(type as InputTypeComposer).getType && !(type as TypeComposer).getInputTypeComposer;
}

export class InputComposerCreator implements ComposerInstanceCreator<InputTypeComposer> {
    constructor(protected schemaComposer: SchemaComposer<any>,
                protected nameKeeper: TypeNameKeeper,
                protected classSpecialist: ClassSpecialist) {
    }

    create(type: ProvidenTypeSingular): InputTypeComposer {
        if (this.classSpecialist.isClassType(type)) {
            return this.schemaComposer.InputTypeComposer.create({
                name: this.nameKeeper.getInputTypeName(type),
                fields: undefined
            });
        } else if (isInputTypeComposer(type)) {
            return type;
        } else if (isTypeComposer(type)) {
            return type.getInputTypeComposer();
        } else {
            return this.schemaComposer.InputTypeComposer.create(type)
        }
    }

    createFromString(text: string): InputTypeComposer {
        return this.schemaComposer.InputTypeComposer.create(text);
    }
}

export class CannotCreateTypeComposerFromITC extends GraphqlComposeTypescriptError {
    constructor(itc: InputTypeComposer) {
        super(`Cannot create TypeComposer from InputTypeComposer: ${itc.getTypeName()}`);
    }
}

export class OutputComposerCreator implements ComposerInstanceCreator<TypeComposer> {
    constructor(protected schemaComposer: SchemaComposer<any>,
                protected nameKeeper: TypeNameKeeper,
                protected classSpecialist: ClassSpecialist) {
    }

    create(type: ProvidenTypeSingular): TypeComposer {
        if (this.classSpecialist.isClassType(type)) {
            return this.schemaComposer.TypeComposer.create({
                name: this.nameKeeper.getTypeName(type),
            })
        } else if (isTypeComposer(type)) {
            return type;
        } else if (isInputTypeComposer(type)) {
            throw new CannotCreateTypeComposerFromITC(type);
        } else {
            return this.schemaComposer.TypeComposer.create(type)
        }
    }

    createFromString(text: string): TypeComposer {
        return this.schemaComposer.TypeComposer.create(text);
    }
}
