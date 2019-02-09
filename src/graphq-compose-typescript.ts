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
import {BaseQueue, InputTypeQueueItem, OutputTypeQueueItem, Queue} from "./type-composer-creation/queue";
import {TypeNameKeeper} from "./type-name";
import {QueueSolver} from "./type-composer-creation/queue-solver";
import {InputTypeSpecKeeper} from "./input-type-spec";
import {PropertyTypeKeeper} from "./metadata";
import {ArgumentTypeConvertor, PropertyTypeConvertor} from "./argument-type-convertor";
import {Mounter} from "./mounting/mounter";
import {MountPointSpecKeeper} from "./mounting/mountpoint-spec-keeper";
import {
    InputComposerCreator,
    OutputComposerCreator,
    ComposerCreator
} from "./type-composer-creation/composer-creator";
import {InputFieldCreator, OutputFieldCreator} from "./type-composer-creation/field-creators";
import {ComposerBuilder} from "./type-composer-creation/composer-builder";
import {ProvidenTypeConvertor} from "./providenTypeConvertor";
import {SourceArgSpecKeeper} from "./resolver/source-arg-spec-keeper";
import {ContextSpecKeeper} from "./context/context-spec-keeper";

export type ProvidenOutputType = ComposeOutputType<any, any> | ClassType | Array<ClassType>;
export type ProvidenInputType = ComposeInputType | ClassType | Array<ClassType>;
export type ProvidenType = ProvidenInputType | ProvidenOutputType;

export type OutputTypeFn = () => ProvidenOutputType;
export type InputTypeFn = () => ProvidenInputType;
export type TypeFn = OutputTypeFn | InputTypeFn;

export interface DefaultContext<T> {

}

export class ArgumentsMapper {
    mapArguments(args: any, paramNames: string[]): any[] {
        if (paramNames.length === 0) return [];
        args = args || {};
        let parameters = [];
        for (const name of paramNames) {
            parameters.push(args[name]);
        }
        return parameters;
    }
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
                protected typeComposerCreator: ComposerCreator,
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
        const ptk = new PropertyTypeKeeper();
        const fieldSpecKeeper = new FieldSpecKeeper();
        const inputTypeSpecKeeper = new InputTypeSpecKeeper();
        const typeNameKeeper = new TypeNameKeeper(inputTypeSpecKeeper);
        const inputComposerCreator = new InputComposerCreator(schemaComposer, typeNameKeeper, classSpecialist);
        const outputComposerCreator = new OutputComposerCreator(schemaComposer, typeNameKeeper, classSpecialist);
        const inputTypeComposerBaseQueue = new BaseQueue<InputTypeComposer>(inputComposerCreator, InputTypeQueueItem);
        const typeComposerBaseQueue = new BaseQueue<TypeComposer>(outputComposerCreator, OutputTypeQueueItem);
        const queue = new Queue(inputTypeComposerBaseQueue, typeComposerBaseQueue);
        const providenInputTypeConvertor = new ProvidenTypeConvertor<ComposeInputType>(
            classSpecialist,
            fieldSpecKeeper,
            inputTypeComposerBaseQueue,
            inputComposerCreator, schemaComposer);
        const providenOutputTypeConvertor = new ProvidenTypeConvertor<ComposeOutputType<any, any>>(
            classSpecialist,
            fieldSpecKeeper,
            typeComposerBaseQueue,
            outputComposerCreator,
            schemaComposer);
        const argumentTypeConvertor = new ArgumentTypeConvertor(ptk, providenInputTypeConvertor);
        const paramsNamesKeeper = new ParamsNamesKeeper();
        const argumentsBuilder = new ArgumentsBuilder(argumentTypeConvertor, paramsNamesKeeper);
        const propertyOutputTypeConvertor = new PropertyTypeConvertor<ComposeOutputType<any, any>>(
            providenOutputTypeConvertor,
            ptk);
        const argumentsMapper = new ArgumentsMapper();
        const outputFieldCreator = new OutputFieldCreator(
            argumentsBuilder,
            argumentsMapper,
            propertyOutputTypeConvertor,
            ptk,
            schemaComposer,
            paramsNamesKeeper);
        const typeComposerComposerBuilder = new ComposerBuilder<TypeComposer>(
            fieldSpecKeeper,
            schemaComposer,
            outputFieldCreator);
        const propertyInputTypeConvertor = new PropertyTypeConvertor<ComposeInputType>(providenInputTypeConvertor, ptk);
        const inputFieldCreator = new InputFieldCreator(propertyInputTypeConvertor, schemaComposer);
        const inputTypeComposerComposerBuilder = new ComposerBuilder<InputTypeComposer>(
            fieldSpecKeeper,
            schemaComposer,
            inputFieldCreator);
        const typeComposerCreator = new ComposerCreator(outputComposerCreator, inputComposerCreator,
            typeComposerComposerBuilder, inputTypeComposerComposerBuilder);
        const resolverSpecStorage = new ResolverSpecStorage();
        const queueSolver = new QueueSolver(queue, typeComposerComposerBuilder, inputTypeComposerComposerBuilder, classSpecialist);
        const resolverBuilder = new ResolverBuilder(propertyOutputTypeConvertor,
            argumentsBuilder,
            argumentsMapper,
            queueSolver,
            resolverSpecStorage,
            paramsNamesKeeper,
            new SourceArgSpecKeeper(),
            new ContextSpecKeeper(),
            schemaComposer);
        const mountPointSpecKeeper = new MountPointSpecKeeper();
        const mounter = new Mounter(providenOutputTypeConvertor, resolverBuilder, classSpecialist, mountPointSpecKeeper);
        return new GraphqlComposeTypescript(schemaComposer, mounter, typeComposerCreator, resolverBuilder, queueSolver);
    }
}

export interface ClassType<T = any> extends Function {
    new(...args: any[]): T;
}
