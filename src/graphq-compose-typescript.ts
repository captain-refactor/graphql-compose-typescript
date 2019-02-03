import {
    ComposeInputType,
    ComposeOutputType,
    Resolver,
    schemaComposer,
    SchemaComposer,
    TypeComposer
} from "graphql-compose";
import {TypeAsString} from "graphql-compose/lib/TypeMapper";
import {GraphQLOutputType} from "graphql";
import {getReturnTypeFromMetadata} from "./metadata";
import {AnnotatedClass, TypeComposerCreator} from "./object-type-composition";
import {StringKey} from "./utils";
import {Mounter, TypeNameConvertor} from "./mounting";
import {isDecorated} from "./field-spec";
import {ArgumentsBuilder} from "./arguments-builder";
import {ResolverBuilder, ResolverSpecStorage} from "./resolver-builder";

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


export function isMethod<T>(constructor: ClassType<T>, name: StringKey<T>): boolean {
    return getPropertyType(constructor, name) == Function;
}


export class TypeMapper {
    constructor() {
    }

    toInputType(type: ComposeOutputType<any, any, any>): ComposeInputType {
        if ((type as TypeComposer).getInputType) {
            return (type as TypeComposer).getInputType();
        }
        return type as ComposeInputType;

    }

    getGraphqlTypeFromClass(typeClass: ClassType): ComposeOutputType<any, any> | null {
        if (!typeClass) return null;
        if (typeClass === Number) {
            return 'Float';
        } else {
            return typeClass.name;
        }
    }

    mapOutputType(type: ProvidenType): ComposeOutputType<any, any> | null {
        if (!type) return null;
        if (isClassType(type)) {
            return this.getGraphqlTypeFromClass(type);
        } else if (isArrayClassType(type)) {
            return [this.getGraphqlTypeFromClass(type[0]) as any]
        } else {
            return type;
        }
    }

    getPropertyGraphqlType(constructor: ClassType, property: string, providenTypeFn?: TypeFn): ComposeOutputType<any, any> {
        let providenType = this.mapOutputType(providenTypeFn && providenTypeFn());

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
        let result = providenType || this.getGraphqlTypeFromClass(typeClass);
        if (!result) throw new TypeNotSpecified(constructor, property);
        return result;
    }
}

export class GraphqlComposeTypescript {

    constructor(public readonly schemaComposer: SchemaComposer<any>,
                protected mounter: Mounter,
                protected typeComposerCreator: TypeComposerCreator,
                protected resolverBuilder: ResolverBuilder) {
    }

    mountInstances(instances: any[]): SchemaComposer<any> {
        this.mounter.mountInstances(this.schemaComposer, instances);
        return this.schemaComposer;
    }

    getComposer<T>(typeOrInstance: AnnotatedClass<T>): TypeComposer<T, DefaultContext<T>> {
        return this.typeComposerCreator.getOrCreateComposer(typeOrInstance);
    }

    getResolver<T>(instance: T, method: keyof T & string): Resolver<T> {
        return this.resolverBuilder.createResolver(instance, method);
    }

    static create() {
        const nameConvertor = new TypeNameConvertor();
        let typeMapper = new TypeMapper(null);
        let argumentsBuilder = new ArgumentsBuilder(typeMapper);
        let typeComposerCreator = new TypeComposerCreator(argumentsBuilder, typeMapper);
        typeMapper.typeComposerCreator = typeComposerCreator; //TODO: circular deps
        let resolverBuilder = new ResolverBuilder(typeMapper, argumentsBuilder, new ResolverSpecStorage());
        const mounter = new Mounter(nameConvertor, resolverBuilder);
        return new GraphqlComposeTypescript(schemaComposer, mounter, typeComposerCreator, resolverBuilder);
    }
}

export interface ClassType<T = any> extends Function {
    new(...args: any[]): T;
}
