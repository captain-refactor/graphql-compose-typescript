import {
    ComposeInputType,
    ComposeOutputType,
    Resolver,
    SchemaComposer,
    TypeComposer
} from "graphql-compose";
import {AnnotatedClass, TypeComposerCreator} from "./object-type-composition";
import {StringKey} from "./utils";
import {Mounter, TypeNameConvertor} from "./mounting";
import {ArgumentsBuilder} from "./arguments-builder";
import {ResolverBuilder, ResolverSpecStorage} from "./resolver-builder";
import {FieldSpecKeeper} from "./field-spec";
import {Queue} from "./class-type/queue";
import {TypeNameKeeper} from "./type-name";
import {QueueSolver} from "./class-type/queue-solver";
import {InputTypeSpecKeeper} from "./input-type-spec";
import {ProvidenTypeConvertor} from "./providenTypeConvertor";
import {PropertyTypeKeeper} from "./metadata";

export type ProvidenType = ComposeOutputType<any, any> | ClassType | [ClassType];

export type TypeFn = () => ProvidenType;

export interface DefaultContext<T> {

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

export class ClassSpecialist {
    isClassType(type: ProvidenType): type is ClassType<any> {
        return type instanceof Function;
    }

    isArrayClassType(type: ProvidenType): type is [ClassType<any>] {
        return Array.isArray(type) && this.isClassType(type[0]);
    }
}

export class TypeMapper {

    constructor(protected providenTypeConvertor: ProvidenTypeConvertor,
                protected propertyTypeKeeper: PropertyTypeKeeper) {
    }

    getPropertyOutputType(constructor: ClassType, property: string, typeFn?: TypeFn): ComposeOutputType<any, any> {
        let providenType: ProvidenType = typeFn && typeFn();
        let typeClass: ClassType = this.propertyTypeKeeper.getPropertyType(constructor, property);
        if (typeClass == Promise && !providenType) {
            throw new TypeNotSpecified(constructor, property);
        }
        if (typeClass == Array) {
            if (!providenType) throw new ArrayTypeNotSpecified(constructor, property);
            if (!Array.isArray(providenType)) {
                providenType = [providenType] as ProvidenType;
            }
        }
        let result = providenType || typeClass;
        if (!result) throw new TypeNotSpecified(constructor, property);
        return this.providenTypeConvertor.mapToOutputType(result);
    }

    getPropertyInputType<T>(constructor: ClassType<T>, key: StringKey<T>, typeFn: TypeFn): ComposeInputType {
        let providenType = this.providenTypeConvertor.mapToInputType(typeFn && typeFn());

        return providenType;
    }
}

export class GraphqlComposeTypescript {

    constructor(public readonly schemaComposer: SchemaComposer<any>,
                protected mounter: Mounter,
                protected typeComposerCreator: TypeComposerCreator,
                protected resolverBuilder: ResolverBuilder,
                protected solver: QueueSolver) {
    }

    mountInstances(instances: any[]): SchemaComposer<any> {
        this.mounter.mountInstances(this.schemaComposer, instances);
        return this.schemaComposer;
    }

    getComposer<T>(typeOrInstance: AnnotatedClass<T>): TypeComposer<T, DefaultContext<T>> {
        let composer = this.typeComposerCreator.createTypeComposer(typeOrInstance);
        this.solver.solve();
        return composer;
    }

    getResolver<T>(instance: T, method: keyof T & string): Resolver<T> {
        return this.resolverBuilder.createResolver(instance, method);
    }

    static create(schemaComposer: SchemaComposer<any>) {
        const classSpecialist = new ClassSpecialist();
        const nameConvertor = new TypeNameConvertor(classSpecialist);
        const ptk = new PropertyTypeKeeper();
        const fieldSpecKeeper = new FieldSpecKeeper();
        const typeNameKeeper = new TypeNameKeeper(classSpecialist);
        const inputTypeSpecKeeper = new InputTypeSpecKeeper();
        const queue = new Queue(schemaComposer, typeNameKeeper);
        const typeMapper = new TypeMapper(new ProvidenTypeConvertor(fieldSpecKeeper, classSpecialist, queue, schemaComposer), ptk);
        const argumentsBuilder = new ArgumentsBuilder(new ProvidenTypeConvertor(fieldSpecKeeper, classSpecialist, queue, schemaComposer));
        const typeComposerCreator = new TypeComposerCreator(argumentsBuilder, typeMapper, fieldSpecKeeper, ptk, schemaComposer, typeNameKeeper);
        const resolverSpecStorage = new ResolverSpecStorage();
        const queueSolver = new QueueSolver(queue, typeComposerCreator);
        const resolverBuilder = new ResolverBuilder(typeMapper, argumentsBuilder, queueSolver, resolverSpecStorage, schemaComposer);
        const mounter = new Mounter(nameConvertor, resolverBuilder);
        return new GraphqlComposeTypescript(schemaComposer, mounter, typeComposerCreator, resolverBuilder, queueSolver);
    }
}

export interface ClassType<T = any> extends Function {
    new(...args: any[]): T;
}
