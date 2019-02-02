import { ClassType, getPropertyGraphqlType, mapArguments, TypeFn } from "./graphq-compose-typescript";
import {Resolver} from "graphql-compose";
import {getConstructor, StringKey} from "./utils";
import {getArguments, getParamNames} from "./arguments-builder";


export const RESOLVER_SPECS = Symbol.for('resolver specifications');

export interface ResolverSpec {
    method: string;
    typeFn: TypeFn;
}

export interface ClassWithResolversSpecs<T> extends ClassType<T> {
    [RESOLVER_SPECS]?: Map<StringKey<T>, ResolverSpec>
}

export function addResolverSpec<T>(constructor: ClassWithResolversSpecs<T>, method: keyof T & string, typeFn: TypeFn) {
    if (!constructor[RESOLVER_SPECS]) {
        constructor[RESOLVER_SPECS] = new Map();
    }
    constructor[RESOLVER_SPECS].set(method, {method, typeFn});
}

export function getResolverSpec<T>(constructor: ClassWithResolversSpecs<T>, method: keyof T & string) {
    if (!constructor[RESOLVER_SPECS]) return null;
    return constructor[RESOLVER_SPECS].get(method);
}

export function createResolver<T>(instance: T, method: StringKey<T>) {
    let constructor = getConstructor(instance);
    let spec = getResolverSpec(constructor, method);
    const {typeFn} = spec;
    return new Resolver({
        name: method,
        type: getPropertyGraphqlType(constructor, method, typeFn),
        args: getArguments(constructor, method),
        resolve(rp) {
            let parameters = mapArguments(rp.args, getParamNames(constructor, method));
            let instanceMethod: Function = instance[method] as any;
            return instanceMethod(...parameters);
        }
    });
}
