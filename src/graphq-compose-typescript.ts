import {
    ComposeInputType,
    ComposeOutputType, InputTypeComposer,
    Resolver, schemaComposer,
    SchemaComposer,
    TypeComposer
} from "graphql-compose";

import {ArgumentsBuilder, ParamsNamesKeeper} from "./arguments-builder";
import {ResolverBuilder, ResolverSpecStorage} from "./resolver-builder";
import {FieldSpecKeeper} from "./field-spec";
import {Queue} from "./class-type/queue";
import {TypeNameKeeper} from "./type-name";
import {QueueSolver} from "./class-type/queue-solver";
import {InputTypeSpecKeeper} from "./input-type-spec";
import {ProvidenTypeConvertor} from "./providenTypeConvertor";
import {PropertyTypeKeeper} from "./metadata";
import {TypeMapper} from "./type-mapper";
import {Mounter} from "./mounting/mounter";
import {TypeNameConvertor} from "./mounting/type-name-convertor";
import {MountPointSpecKeeper} from "./mounting/mountpoint-spec-keeper";
import {TypeComposerCreator} from "./type-composer-creation/type-composer-creator";
import {InputFieldCreator, OutputFieldCreator} from "./type-composer-creation/field-creators";
import {ComposerBuilder} from "./type-composer-creation/composer-builder";

export type ProvidenOutputType = ComposeOutputType<any, any> | ClassType | [ClassType];
export type ProvidenInputType = ComposeInputType | ClassType | [ClassType];

export type OutputTypeFn = () => ProvidenOutputType;
export type InputTypeFn = () => ProvidenInputType;
export type TypeFn = OutputTypeFn | InputTypeFn;

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
    isClassType(type: ProvidenOutputType | ProvidenInputType): type is ClassType<any> {
        return type instanceof Function;
    }

    isArrayClassType(type: ProvidenOutputType | ProvidenInputType): type is [ClassType<any>] {
        return Array.isArray(type) && this.isClassType(type[0]);
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

    getComposer<T>(typeOrInstance: ClassType<T>): TypeComposer<T, DefaultContext<T>> {
        let composer = this.typeComposerCreator.createTypeComposer(typeOrInstance);
        this.solver.solve();
        return composer;
    }

    getResolver<T>(instance: T, method: keyof T & string): Resolver<T> {
        return this.resolverBuilder.createResolver(instance, method);
    }

    static createGlobal() {
        return this.create(schemaComposer);
    }

    static create(schemaComposer: SchemaComposer<any>) {
        const classSpecialist = new ClassSpecialist();
        const nameConvertor = new TypeNameConvertor(classSpecialist);
        const ptk = new PropertyTypeKeeper();
        const fieldSpecKeeper = new FieldSpecKeeper();
        const inputTypeSpecKeeper = new InputTypeSpecKeeper();
        const typeNameKeeper = new TypeNameKeeper(inputTypeSpecKeeper);
        const queue = new Queue(schemaComposer, typeNameKeeper);
        const providenTypeConvertor = new ProvidenTypeConvertor(fieldSpecKeeper, classSpecialist, queue, schemaComposer);
        const typeMapper = new TypeMapper(providenTypeConvertor, ptk);
        const paramsNamesKeeper = new ParamsNamesKeeper();
        const argumentsBuilder = new ArgumentsBuilder(typeMapper, paramsNamesKeeper);
        const outputFieldCreator = new OutputFieldCreator(argumentsBuilder, typeMapper, ptk, schemaComposer, paramsNamesKeeper);
        const typeComposerComposerBuilder = new ComposerBuilder<TypeComposer>(fieldSpecKeeper, schemaComposer, outputFieldCreator);
        const inputFieldCreator = new InputFieldCreator(typeMapper, schemaComposer);
        const inputTypeComposerComposerBuilder = new ComposerBuilder<InputTypeComposer>(fieldSpecKeeper, schemaComposer, inputFieldCreator);
        const typeComposerCreator = new TypeComposerCreator(schemaComposer, typeNameKeeper, typeComposerComposerBuilder, inputTypeComposerComposerBuilder);
        const resolverSpecStorage = new ResolverSpecStorage();
        const queueSolver = new QueueSolver(queue, typeComposerComposerBuilder, inputTypeComposerComposerBuilder);
        const resolverBuilder = new ResolverBuilder(typeMapper, argumentsBuilder, queueSolver, resolverSpecStorage, paramsNamesKeeper, schemaComposer);
        const mounter = new Mounter(nameConvertor, resolverBuilder, new MountPointSpecKeeper());
        return new GraphqlComposeTypescript(schemaComposer, mounter, typeComposerCreator, resolverBuilder, queueSolver);
    }
}

export interface ClassType<T = any> extends Function {
    new(...args: any[]): T;
}
