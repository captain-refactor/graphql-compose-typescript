import {
    ClassType, getPropertyGraphqlType, isMethod, mapArguments, TypeFn,
} from "./graphq-compose-typescript";
import {ComposeFieldConfigMap, TypeComposer} from "graphql-compose";
import {getFieldTypes, isDecorated} from "./field-spec";
import {getArguments, getParamNames} from "./arguments-builder";
import {GraphQLFieldResolver} from "graphql";
import {StringKey} from "./utils";

export const COMPOSER = Symbol.for('GraphQL class metadata');

export interface AnnotatedClass<T, Ctx = any> extends ClassType<T> {
    [COMPOSER]?: TypeComposer<T, Ctx>
}

export function createResolver<T>(constructor: ClassType<T>, key: StringKey<T>): GraphQLFieldResolver<T, any> {
    return (source: T, args) => {
        let method: Function = constructor.prototype[key] as any;
        return method.bind(source)(...mapArguments(args, getParamNames(constructor, key)));
    };
}

export function createTypeComposer<T>(constructor: ClassType<T>): TypeComposer<T> {
    let fields: ComposeFieldConfigMap<T, any> = getFieldTypes(constructor).map((typeFn: TypeFn, key) => {
        let args = getArguments(constructor, key);
        let type = getPropertyGraphqlType(constructor, key, typeFn);
        let resolve = isMethod(constructor, key) ? createResolver(constructor, key) : undefined;
        return {
            type,
            args,
            resolve
        };
    }).toObject();
    return TypeComposer.createTemp({
        name: constructor.name,
        fields
    });
}

export function getComposer<T>(typeOrInstance: ClassType<T> | T): TypeComposer<T> {
    if (!Object.getOwnPropertyDescriptor(typeOrInstance, COMPOSER)) return null;
    return typeOrInstance[COMPOSER];
}

export function setComposer<T>(typeOrInstance: ClassType<T> | T, composer: TypeComposer<T>) {
    typeOrInstance[COMPOSER] = composer;
}


export function getOrCreateComposer<T>(constructor: AnnotatedClass<T>): TypeComposer<T> {
    const composer = getComposer(constructor);
    if (!composer) {
        if (!isDecorated(constructor)) return null;
        setComposer(constructor, createTypeComposer(constructor));
    }
    return getComposer(constructor);
}
