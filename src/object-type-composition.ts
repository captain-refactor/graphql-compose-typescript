import {
    ClassType, DefaultContext, mapArguments, TypeFn,
} from "./graphq-compose-typescript";
import {
    ComposeFieldConfig,
    ComposeFieldConfigMap, ComposeInputFieldConfig, ComposeInputFieldConfigMap,
    ComposeOutputType, InputTypeComposer,
    SchemaComposer,
    TypeComposer
} from "graphql-compose";
import {ArgumentsBuilder, ParamsNamesKeeper} from "./arguments-builder";
import {GraphQLFieldResolver} from "graphql";
import {StringKey} from "./utils";
import {FieldSpecKeeper} from "./field-spec";
import {TypeNameKeeper} from "./type-name";
import {PropertyTypeKeeper} from "./metadata";
import {TypeMapper} from "./type-mapper";

export const COMPOSER = Symbol.for('GraphQL class metadata');

export interface AnnotatedClass<T, Ctx = any> extends ClassType<T> {
    [COMPOSER]?: TypeComposer<T, Ctx>
}


export class TypeComposerCreator {
    constructor(protected argumentsBuilder: ArgumentsBuilder,
                protected typeMapper: TypeMapper,
                protected fieldSpec: FieldSpecKeeper,
                protected propertyTypeKeeper: PropertyTypeKeeper,
                protected schemaComposer: SchemaComposer<any>,
                protected paramsNamesKeeper:ParamsNamesKeeper,
                protected nameKeeper: TypeNameKeeper) {
    }

    protected createResolver<T>(constructor: ClassType<T>, key: StringKey<T>): GraphQLFieldResolver<T, any> {
        let paramsNamesKeeper = this.paramsNamesKeeper;
        return (source: T, args) => {
            let method: Function = constructor.prototype[key] as any;
            return method.bind(source)(...mapArguments(args, paramsNamesKeeper.getParamNames(constructor, key)));
        };
    }

    protected createField<T>(constructor: ClassType<T>, typeFn: TypeFn, key): ComposeFieldConfig<T, DefaultContext<T>> {
        let args = this.argumentsBuilder.getArguments(constructor, key);
        let type: ComposeOutputType<any, any> = this.typeMapper.getPropertyOutputType(constructor, key, typeFn);
        let resolve = this.propertyTypeKeeper.isMethod(constructor, key) ? this.createResolver(constructor, key) : undefined;
        return {
            type,
            args,
            resolve
        };
    }

    private createInputField<T>(constructor: ClassType<T>, typeFn: TypeFn, key: StringKey<T>): ComposeInputFieldConfig {

        const type = this.typeMapper.getPropertyInputType(constructor, key, typeFn);
        return {
            type
        }
    }

    buildTypeComposer<T>(constructor: ClassType<T>, composer: TypeComposer<T>) {
        if (!this.fieldSpec.isDecorated(constructor)) return null;
        let fields = this.createFields(constructor);
        composer.addFields(fields);
    }

    createTypeComposer<T>(constructor: ClassType<T>): TypeComposer<T> {
        const composer = this.schemaComposer.TypeComposer.create({
            name: this.nameKeeper.getTypeName(constructor)
        });
        this.buildTypeComposer(constructor, composer);
        return composer;
    }

    private createFields<T>(constructor: ClassType<T>): ComposeFieldConfigMap<T, any> {
        let fields: ComposeFieldConfigMap<T, any> = {};
        for (const [key, typeFn] of this.fieldSpec.getFieldTypes(constructor)) {
            fields[key] = this.createField(constructor, typeFn, key);
        }
        return fields;
    }

    private createInputFields<T>(constructor: ClassType<T>): ComposeInputFieldConfigMap {
        let fields: ComposeInputFieldConfigMap = {};
        for (const [key, typeFn] of this.fieldSpec.getFieldTypes(constructor)) {
            fields[key] = this.createInputField(constructor, typeFn, key)
        }
        return fields;
    }

    buildInputTypeComposer<T>(type: ClassType, composer: InputTypeComposer) {
        if (!this.fieldSpec.isDecorated(type)) return null;
        let fields = this.createInputFields(type);
        composer.addFields(fields);
    }
}
