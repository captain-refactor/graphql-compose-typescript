import {ClassType, mapArguments, OutputTypeFn} from "./graphq-compose-typescript";
import {Resolver, SchemaComposer} from "graphql-compose";
import {getConstructor, StringKey} from "./utils";
import {ArgumentsBuilder, ParamsNamesKeeper} from "./arguments-builder";
import {QueueSolver} from "./type-composer-creation/queue-solver";
import {TypeMapper} from "./type-mapper";

export const RESOLVER_SPECS = Symbol.for('resolver specifications');

export interface ResolverSpec {
    method: string;
    typeFn: OutputTypeFn;
}

export interface ClassWithResolversSpecs<T> extends ClassType<T> {
    [RESOLVER_SPECS]?: Map<StringKey<T>, ResolverSpec>
}

export class ResolverSpecStorage {
    addResolverSpec<T>(constructor: ClassWithResolversSpecs<T>, method: StringKey<T>, typeFn: OutputTypeFn) {
        if (!constructor[RESOLVER_SPECS]) {
            constructor[RESOLVER_SPECS] = new Map();
        }
        constructor[RESOLVER_SPECS].set(method, {method, typeFn});
    }

    getResolverSpec<T>(constructor: ClassWithResolversSpecs<T>, method: StringKey<T>) {
        if (!constructor[RESOLVER_SPECS]) return null;
        return constructor[RESOLVER_SPECS].get(method);
    }
}


export class ResolverBuilder {
    constructor(protected typeMapper: TypeMapper,
                protected argumentsBuilder: ArgumentsBuilder,
                protected queueSolver: QueueSolver,
                protected storage: ResolverSpecStorage,
                protected paramsNamesKeeper: ParamsNamesKeeper,
                protected schemaComposer: SchemaComposer<any>) {
    }

    createResolver<T>(instance: T, method: StringKey<T>): Resolver<any, any, any> {
        let constructor = getConstructor(instance);
        let spec = this.storage.getResolverSpec(constructor, method);
        const {typeFn} = spec;
        const type = this.typeMapper.getPropertyOutputType(constructor, method, typeFn);
        let args = this.argumentsBuilder.getArguments(constructor, method);
        this.queueSolver.solve();
        const paramsNamesKeeper = this.paramsNamesKeeper;
        return new this.schemaComposer.Resolver({
            name: method,
            type,
            args,
            async resolve(rp) {
                let parameters = mapArguments(rp.args, paramsNamesKeeper.getParamNames(constructor, method));
                return await (instance[method] as any)(...parameters);
            }
        });
    }
}
