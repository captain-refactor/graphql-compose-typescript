import {InputTypeComposer, SchemaComposer, TypeComposer} from "graphql-compose";
import {TypeNameKeeper} from "../type-name";
import {ClassType} from "../graphq-compose-typescript";
import {ComposerBuilder} from "./composer-builder";

export class TypeComposerCreator {
    constructor(protected schemaComposer: SchemaComposer<any>,
                protected nameKeeper: TypeNameKeeper,
                protected outputBuilder: ComposerBuilder<TypeComposer>,
                protected inputBuilder: ComposerBuilder<InputTypeComposer>) {
    }

    createTypeComposer<T>(constructor: ClassType<T>): TypeComposer<T> {
        const composer = this.schemaComposer.TypeComposer.create({
            name: this.nameKeeper.getTypeName(constructor),
            fields: undefined
        });
        this.outputBuilder.build(constructor, composer);
        return composer;
    }

    createInputTypeComposer(constructor: ClassType): InputTypeComposer {
        const composer = this.schemaComposer.InputTypeComposer.create({
            name: this.nameKeeper.getTypeName(constructor),
            fields: undefined
        });
        this.inputBuilder.build(constructor, composer);
        return composer;
    }
}
