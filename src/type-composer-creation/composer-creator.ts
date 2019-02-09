import {InputTypeComposer, SchemaComposer, TypeComposer} from "graphql-compose";
import {TypeNameKeeper} from "../type-name";
import {ClassType} from "../graphq-compose-typescript";
import {ComposerBuilder} from "./composer-builder";

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
    create(type: ClassType): C
}

export class InputComposerCreator implements ComposerInstanceCreator<InputTypeComposer> {
    constructor(protected schemaComposer: SchemaComposer<any>,
                protected nameKeeper: TypeNameKeeper) {
    }

    create(type: ClassType): InputTypeComposer {
        return this.schemaComposer.InputTypeComposer.create({
            name: this.nameKeeper.getInputTypeName(type),
            fields: undefined
        });
    }
}

export class OutputComposerCreator implements ComposerInstanceCreator<TypeComposer> {
    constructor(protected schemaComposer: SchemaComposer<any>,
                protected nameKeeper: TypeNameKeeper) {
    }

    create(type: ClassType): TypeComposer {
        return this.schemaComposer.TypeComposer.create({
            name: this.nameKeeper.getTypeName(type),
            fields: undefined
        });
    }
}
