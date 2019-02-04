import {
    ClassType, DefaultContext, mapArguments, PropertyTypeKeeper, TypeFn, TypeMapper,
} from "./graphq-compose-typescript";
import {
    ComposeFieldConfig,
    ComposeFieldConfigMap,
    ComposeOutputType,
    SchemaComposer,
    TypeComposer
} from "graphql-compose";
import {ArgumentsBuilder, getParamNames} from "./arguments-builder";
import {GraphQLFieldResolver} from "graphql";
import {StringKey} from "./utils";
import {FieldSpecKeeper} from "./field-spec";

export const COMPOSER = Symbol.for('GraphQL class metadata');

export interface AnnotatedClass<T, Ctx = any> extends ClassType<T> {
    [COMPOSER]?: TypeComposer<T, Ctx>
}


export class TypeComposerCreator {
    constructor(protected argumentsBuilder: ArgumentsBuilder,
                protected typeMapper: TypeMapper,
                protected fieldSpec: FieldSpecKeeper,
                protected propertyTypeKeeper: PropertyTypeKeeper,
                protected schemaComposer: SchemaComposer<any>) {
    }

    protected getComposer<T>(typeOrInstance: ClassType<T> | T): TypeComposer<T> {
        if (!Object.getOwnPropertyDescriptor(typeOrInstance, COMPOSER)) return null;
        return typeOrInstance[COMPOSER];
    }

    protected setComposer<T>(typeOrInstance: ClassType<T> | T, composer: TypeComposer<T>) {
        typeOrInstance[COMPOSER] = composer;
    }

    getOrCreateComposer<T>(constructor: AnnotatedClass<T>): TypeComposer<T> {
        const composer = this.getComposer(constructor);
        if (!composer) {
            if (!this.fieldSpec.isDecorated(constructor)) return null;
            this.setComposer(constructor, this.createTypeComposer(constructor));
        }
        return this.getComposer(constructor);
    }

    protected createResolver<T>(constructor: ClassType<T>, key: StringKey<T>): GraphQLFieldResolver<T, any> {
        return (source: T, args) => {
            let method: Function = constructor.prototype[key] as any;
            return method.bind(source)(...mapArguments(args, getParamNames(constructor, key)));
        };
    }

    protected createField<T>(constructor: ClassType<T>, typeFn: TypeFn, key): ComposeFieldConfig<T, DefaultContext<T>> {
        let args = this.argumentsBuilder.getArguments(constructor, key);
        let type: ComposeOutputType<any, any> = this.typeMapper.getPropertyGraphqlType(constructor, key, typeFn);
        let resolve = this.propertyTypeKeeper.isMethod(constructor, key) ? this.createResolver(constructor, key) : undefined;
        return {
            type,
            args,
            resolve
        };
    }

    createTypeComposer<T>(constructor: ClassType<T>): TypeComposer<T> {
        let fields: ComposeFieldConfigMap<T, any> = {};
        for (const [key, typeFn] of this.fieldSpec.getFieldTypes(constructor)) {
            fields[key] = this.createField(constructor, typeFn, key);
        }
        return this.schemaComposer.TypeComposer.create({
            name: constructor.name,
            fields
        });
    }
}
