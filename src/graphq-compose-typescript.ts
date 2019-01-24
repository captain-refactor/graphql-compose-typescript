import {ComposeOutputType, TypeComposer} from "graphql-compose";

export interface IContainer {
    get(type: Function): any;
}

export interface DefaultContext {
    container: IContainer;
}

const COMPOSER = Symbol.for('GraphQL class metadata');

interface AnnotatedClass<T, Ctx = any> extends ClassType<T> {
    [COMPOSER]?: TypeComposer<T, Ctx>
}

export type Dict<T, K extends string | symbol = string> = {
    [key in K]?: T;
}

export function getComposer<T>(type: ClassType<T>): TypeComposer<T> {
    return type[COMPOSER];
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

export function getPropertyTypeFromMetadata(constructor: ClassType, property: string): ComposeOutputType<any, any> {
    let typeClass: ClassType = Reflect.getOwnMetadata('design:type', constructor.prototype, property);
    let type = 'any';
    let composer = getComposer(typeClass);
    if (composer) return composer;
    if (typeClass === Number) {
        type = 'Float';
    } else {
        type = typeClass.name;
    }
    return type;
}


export class GraphqlComposeTypescript<TContext = DefaultContext> {
    getComposer<T>(type: AnnotatedClass<T>): TypeComposer<T, TContext> {
        return getComposer(type);
    }

    // createSchemaFromResolverTypes(types: ClassType[]) {
    //     for (const type of types) {
    //         let composer = this.getComposer(type);
    //
    //     }
    // }

    static create() {
        return new GraphqlComposeTypescript();
    }
}

export interface ClassType<T = any> extends Function {
    new(...args: any[]): T;
}