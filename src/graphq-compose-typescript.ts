import {
    ComposeInputType,
    ComposeOutputType,
    ResolveParams,
    Resolver,
    SchemaComposer,
    TypeComposer
} from "graphql-compose";
import {TypeAsString} from "graphql-compose/lib/TypeMapper";
import {GraphQLOutputType} from "graphql";
import {InstanceMissing} from "./decorators/resolver";


export type ProvidenType = ComposeOutputType<any, any> | ClassType | [ClassType];

export type TypeFn = () => ProvidenType;

export interface DefaultContext<T> {
    // container: IContainer;
    instance: T;
}

const COMPOSER = Symbol.for('GraphQL class metadata');
const PARAM_NAMES = Symbol.for('graphql parameters names');


interface AnnotatedClass<T, Ctx = any> extends ClassType<T> {
    [COMPOSER]?: TypeComposer<T, Ctx>
}

export function getComposer<T>(typeOrInstance: ClassType<T> | T): TypeComposer<T> {
    return typeOrInstance[COMPOSER];
}

export function setComposer<T>(typeOrInstance: ClassType<T> | T, composer: TypeComposer<T>) {
    typeOrInstance[COMPOSER] = composer;
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

export function mapArguments(rp: Partial<ResolveParams<any, any>>, paramNames: string[]) {
    if (paramNames.length === 0) return [];
    let args = rp.args || {};
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

export function getOrCreateComposer<T>(typeOrInstance: AnnotatedClass<T>): TypeComposer<T> {

    function getParentClass(type) {
        return type.__proto__;
    }

    const composer = getComposer(typeOrInstance);
    let parentComposer = getComposer(getParentClass(typeOrInstance));
    if (!composer) {
        setComposer(typeOrInstance, TypeComposer.createTemp({name: typeOrInstance.name}));
    } else if (composer === parentComposer) {
        setComposer(typeOrInstance, parentComposer.clone(typeOrInstance.name));
    }
    return getComposer(typeOrInstance);
}

export function getReturnTypeFromMetadata(constructor: ClassType, property: string): ClassType {
    return Reflect.getOwnMetadata('design:returntype', constructor.prototype, property);
}

export function getParameterTypesFromMetadata(constructor: ClassType, property: string): ClassType[] {
    return Reflect.getOwnMetadata('design:paramtypes', constructor.prototype, property);
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
    return Reflect.getOwnMetadata('design:type', constructor.prototype, property);
}


function isClassType(type: ProvidenType): type is ClassType<any> {
    return type instanceof Function;
}

function isArrayClassType(type: ProvidenType): type is [ClassType<any>] {
    return Array.isArray(type) && isClassType(type[0]);
}

function mapClassType(type: ClassType): TypeComposer<any, any> | TypeAsString | GraphQLOutputType {
    let composer = getComposer(type);
    if (composer) return composer;
    if (type === Number) return 'Float';
    return type.name;
}

function mapOutputType(type: ProvidenType): ComposeOutputType<any, any> | null {
    if (!type) return null;
    if (isClassType(type)) {
        return mapClassType(type);
    } else if (isArrayClassType(type)) {
        return [mapClassType(type[0])]
    } else {
        return type;
    }
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
            return [providenType];
        }
    }
    let result = providenType || getGraphqlTypeFromClass(typeClass);
    if (!result) throw new TypeNotSpecified(constructor, property);
    return result;
}

export function getGraphqlTypeFromClass(typeClass: ClassType): ComposeOutputType<any, any> | null {
    if (!typeClass) return null;
    let type: ComposeOutputType<any, any> = getComposer(typeClass);
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

export function createComposerForInstance<T>(instance: T, newName?: string): TypeComposer<T, DefaultContext<T>> {
    function wrapAllResolvers(composer: TypeComposer) {
        for (let name of composer.getResolvers().keys()) {
            composer.wrapResolverResolve(name, next => rp => {
                if (!rp.context) rp.context = {};
                rp.context.instance = instance;
                return next(rp);
            });
        }
    }

    const constructor = instance.constructor as ClassType<T>;
    let composer = getComposer(constructor);
    if (!composer) return composer;
    const instanceComposer = composer.clone(newName || constructor.name + 'Instance');
    wrapAllResolvers(instanceComposer);
    setComposer(instance, instanceComposer);
    return instanceComposer;
}

export function isInstance<T>(typeOrInstance: AnnotatedClass<T> | T): typeOrInstance is T {
    return !(typeOrInstance.constructor === Function);
}

export function buildResolver(constructor, propertyKey, typeFn): Resolver {
    let resolver = getOrCreateResolver(constructor, propertyKey);
    let graphqlType = getPropertyGraphqlType(constructor, propertyKey, typeFn);
    resolver.setType(graphqlType);
    resolver.setResolve(function (rp) {
        const instance = rp.context && rp.context.instance;
        if (!instance) {
            throw new InstanceMissing(constructor);
        }
        let parameters = mapArguments(rp, getParamNames(constructor, propertyKey));
        return instance[propertyKey](...parameters);
    });
    return resolver;
}

const SCHEMA_COMPOSER = Symbol.for('schema composer');


function getSchemaComposer<T>(constructor: AnnotatedClass<T> | T) {
    return constructor[SCHEMA_COMPOSER];
}

function setSchemaComposer<T>(constructor: AnnotatedClass<T>, composer: SchemaComposer<any>) {
    constructor[SCHEMA_COMPOSER] = composer;
}

export function getOrCreateSchemaComposer<T>(constructor: AnnotatedClass<T>): SchemaComposer<any> {
    let composer = getSchemaComposer(constructor);
    if (!composer) {
        composer = new SchemaComposer();
        setSchemaComposer(constructor, composer);
    }
    return composer;
}

export function getConstructor<T>(instance: T): AnnotatedClass<T> {
    return instance.constructor as any;
}

function createSchemaComposerForInstance<T>(instance: T): SchemaComposer<any> {
    let constructor = getConstructor(instance);
    let composer = getSchemaComposer(constructor);
    for (let key of composer.Query.getFieldNames()) {
        composer.Query.getFieldTC(key).wrapResolver(key, next => rp => {
            if (!rp.context) rp.context = {};
            rp.context.instance = instance;
            return next(rp);
        });

    }
    return composer;
}

export class GraphqlComposeTypescript {
    getComposer<T>(typeOrInstance: AnnotatedClass<T> | T): TypeComposer<T, DefaultContext<T>> {
        let composer = getComposer(typeOrInstance);
        if (!composer && isInstance(typeOrInstance)) {
            composer = createComposerForInstance(typeOrInstance);
        }
        return composer;
    }

    getSchemaComposer<T>(typeOrInstance: AnnotatedClass<T> | T): SchemaComposer<DefaultContext<T>> {
        let composer = getSchemaComposer(typeOrInstance);
        if (!composer && isInstance(typeOrInstance)) {
            composer = createSchemaComposerForInstance(typeOrInstance);
        }
        return composer;
    }

    static create() {
        return new GraphqlComposeTypescript();
    }
}

export interface ClassType<T = any> extends Function {
    new(...args: any[]): T;
}
