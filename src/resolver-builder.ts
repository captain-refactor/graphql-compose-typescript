import {ClassType, mapArguments, TypeFn, TypeMapper} from "./graphq-compose-typescript";
import {Resolver} from "graphql-compose";
import {getConstructor, StringKey} from "./utils";
import {ArgumentsBuilder, getParamNames} from "./arguments-builder";

export const RESOLVER_SPECS = Symbol.for('resolver specifications');

export interface ResolverSpec {
    method: string;
    typeFn: TypeFn;
}

export interface ClassWithResolversSpecs<T> extends ClassType<T> {
    [RESOLVER_SPECS]?: Map<StringKey<T>, ResolverSpec>
}

export class ResolverSpecStorage{
    addResolverSpec<T>(constructor: ClassWithResolversSpecs<T>, method: StringKey<T>, typeFn: TypeFn) {
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
                protected storage:ResolverSpecStorage) {

    }

    createResolver<T>(instance: T, method: StringKey<T>) {
        let constructor = getConstructor(instance);
        let spec = this.storage.getResolverSpec(constructor, method);
        const {typeFn} = spec;
        return new Resolver({
            name: method,
            type: this.typeMapper.getPropertyGraphqlType(constructor, method, typeFn),
            args: this.argumentsBuilder.getArguments(constructor, method),
            async resolve(rp) {
                let parameters = mapArguments(rp.args, getParamNames(constructor, method));
                return await (instance[method] as any)(...parameters);
            }
        });
    }
}
