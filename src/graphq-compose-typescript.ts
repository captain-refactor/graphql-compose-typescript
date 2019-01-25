import {ComposeInputType, ComposeOutputType, Resolver, TypeComposer} from "graphql-compose";

export interface IContainer {
    get(type: Function): any;
}

export interface DefaultContext {
    container: IContainer;
}

const COMPOSER = Symbol.for('GraphQL class metadata');
const PARAM_NAMES = Symbol.for('graphql parameters names');


interface AnnotatedClass<T, Ctx = any> extends ClassType<T> {
    [COMPOSER]?: TypeComposer<T, Ctx>
}

export type Dict<T, K extends string | symbol = string> = {
    [key in K]?: T;
}

export function getComposer<T>(type: ClassType<T>): TypeComposer<T> {
    return type[COMPOSER];
}

export function getOrCreateResolver<T>(constructor: AnnotatedClass<T>, property: string) {
    const composer = getOrCreateComposer(constructor);
    if (composer.hasResolver(property)) {
        return composer.getResolver(property);
    } else {
        let resolver = new Resolver({name: property});
        composer.addResolver(resolver);
        return resolver;
    }
}

export function mapArguments(args: Dict<any>, paramNames: string[]) {
    let parameters = [];
    for (const name of paramNames) {
        parameters.push(args[name]);
    }
    return parameters;
}

export function setParamName(constructor: ClassType, property: string, name: string, index: number) {
    const propertyNames = getParamNames(constructor, property);
    propertyNames[index] = name;
}

export function getParamNames(constructor: ClassType, property: string) {
    let method = constructor.prototype[property];
    if (!method[PARAM_NAMES]) method[PARAM_NAMES] = [];
    return method[PARAM_NAMES];
}

export function getOrCreateComposer<T>(type: AnnotatedClass<T>): TypeComposer<T> {

    function getParentClass(type) {
        return type.__proto__;
    }

    const composer = getComposer(type);
    let parentComposer = getComposer(getParentClass(type));
    if (!composer) {
        type[COMPOSER] = TypeComposer.create({name: type.name})
    } else if (composer === parentComposer) {
        type[COMPOSER] = parentComposer.clone(type.name);
    }
    return type[COMPOSER];
}

export function getReturnTypeFromMetadata(constructor: ClassType, property: string): ClassType {
    let typeClass = Reflect.getOwnMetadata('design:returntype', constructor.prototype, property);
    return typeClass;
}

export function getParameterTypesFromMetadata(constructor: ClassType, property: string): ClassType[] {
    let typeClasses = Reflect.getOwnMetadata('design:paramtypes', constructor.prototype, property);
    return typeClasses;
}

export class MethodNotAnnotated extends Error {
    constructor(constructor: Function, propertyName: string) {
        super(`${constructor.name}.${propertyName} does not have specified type`);
    }
}

export function getPropertyType(constructor: ClassType, property: string): ClassType {
    return Reflect.getOwnMetadata('design:type', constructor.prototype, property);
}

export function getPropertyGraphqlType(constructor: ClassType, property: string): ComposeOutputType<any, any> {
    let typeClass: ClassType = getPropertyType(constructor, property);

    if (typeClass == Function) {
        typeClass = getReturnTypeFromMetadata(constructor, property);
        if (!typeClass) {
            throw new MethodNotAnnotated(constructor, property);
        }
    }
    return getGraphqlTypeFromClass(typeClass)
}

export function getGraphqlTypeFromClass(typeClass: ClassType): ComposeOutputType<any, any> {
    let type: any = getComposer(typeClass);
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

export class GraphqlComposeTypescript<TContext = DefaultContext> {
    getComposer<T>(type: AnnotatedClass<T>): TypeComposer<T, TContext> {
        return getComposer(type);
    }

    static create() {
        return new GraphqlComposeTypescript();
    }
}

export interface ClassType<T = any> extends Function {
    new(...args: any[]): T;
}
