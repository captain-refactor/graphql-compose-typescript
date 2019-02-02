import {ComposeInputType, ComposeOutputType, Resolver, TypeComposer} from "graphql-compose";
import {TypeAsString} from "graphql-compose/lib/TypeMapper";
import {GraphQLOutputType} from "graphql";
import {createResolver} from "./resolver-builder";
import {getReturnTypeFromMetadata} from "./metadata";
import {AnnotatedClass, getOrCreateComposer} from "./object-type-composition";
import {StringKey} from "./utils";

export type ProvidenType = ComposeOutputType<any, any> | ClassType | [ClassType];

export type TypeFn = () => ProvidenType;

export interface DefaultContext<T> {
    instance: T;
}

export function mapArguments(args: any, paramNames: string[]): any[] {
    if (paramNames.length === 0) return [];
    args = args || {};
    let parameters = [];
    for (const name of paramNames) {
        parameters.push(args[name]);
    }
    return parameters;
}


export class TypeNotSpecified extends Error {
    constructor(constructor: Function, propertyName: string) {
        super(`${constructor.name}.${propertyName} does not have specified type`);
    }
}

export class ArrayTypeNotSpecified extends Error {
    constructor(constructor: Function, propertyName: string) {
        super(`${constructor.name}.${propertyName} does not have specified array item type`);
    }
}

export function getPropertyType(constructor: ClassType, property: string): ClassType {
    return Reflect.getMetadata('design:type', constructor.prototype, property);
}


export function isClassType(type: ProvidenType): type is ClassType<any> {
    return type instanceof Function;
}

export function isArrayClassType(type: ProvidenType): type is [ClassType<any>] {
    return Array.isArray(type) && isClassType(type[0]);
}

function mapClassType(type: ClassType): TypeComposer<any, any> | TypeAsString | GraphQLOutputType {
    let composer = getOrCreateComposer(type);
    if (composer) return composer;
    if (type === Number) return 'Float';
    return type.name;
}

export function mapOutputType(type: ProvidenType): ComposeOutputType<any, any> | null {
    if (!type) return null;
    if (isClassType(type)) {
        return mapClassType(type);
    } else if (isArrayClassType(type)) {
        return [mapClassType(type[0])]
    } else {
        return type;
    }
}

export function isMethod<T>(constructor: ClassType<T>, name: StringKey<T>): boolean {
    return getPropertyType(constructor, name) == Function;
}

export function getPropertyGraphqlType(constructor: ClassType, property: string, providenTypeFn?: TypeFn): ComposeOutputType<any, any> {
    let providenType = mapOutputType(providenTypeFn && providenTypeFn());

    let typeClass: ClassType = getPropertyType(constructor, property);

    if (typeClass == Function) {
        typeClass = getReturnTypeFromMetadata(constructor, property);
    }

    if (typeClass == Promise && !providenType) {
        throw new TypeNotSpecified(constructor, property);
    }

    if (typeClass == Array) {
        if (!providenType) throw new ArrayTypeNotSpecified(constructor, property);
        if (Array.isArray(providenType)) {
            return providenType;
        } else {
            return [providenType] as ComposeOutputType<any, any>;
        }
    }
    let result = providenType || getGraphqlTypeFromClass(typeClass);
    if (!result) throw new TypeNotSpecified(constructor, property);
    return result;
}

export function getGraphqlTypeFromClass(typeClass: ClassType): ComposeOutputType<any, any> | null {
    if (!typeClass) return null;
    let type: ComposeOutputType<any, any> = getOrCreateComposer(typeClass);
    if (type) return type;
    if (typeClass === Number) {
        type = 'Float';
    } else {
        type = typeClass.name;
    }
    return type;
}

export function toInputType(type: ComposeOutputType<any, any, any>): ComposeInputType {
    if ((type as TypeComposer).getInputType) {
        return (type as TypeComposer).getInputType();
    }
    return type as ComposeInputType;

}

export function isInstance<T>(typeOrInstance: AnnotatedClass<T> | T): typeOrInstance is T {
    return !(typeOrInstance.constructor === Function);
}


export class GraphqlComposeTypescript {
    getComposer<T>(typeOrInstance: AnnotatedClass<T>): TypeComposer<T, DefaultContext<T>> {
        return getOrCreateComposer(typeOrInstance);
    }

    getResolver<T>(instance: T, method: keyof T & string): Resolver<T> {
        return createResolver(instance, method);
    }

    static create() {
        return new GraphqlComposeTypescript();
    }
}

export interface ClassType<T = any> extends Function {
    new(...args: any[]): T;
}
