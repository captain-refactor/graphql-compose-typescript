import {
  ArgumentsMapper,
  ClassType,
  OutputTypeFn
} from "./graphq-compose-typescript";
import {
  ComposeOutputType,
  Resolver,
  ResolverWrapCb,
  SchemaComposer
} from "graphql-compose";
import { getConstructor, StringKey } from "./utils";
import { ArgumentsBuilder, ParamsNamesKeeper } from "./arguments-builder";
import { QueueSolver } from "./type-composer-creation/queue-solver";
import { PropertyTypeConvertor } from "./argument-type-convertor";
import { SourceArgSpecKeeper } from "./resolver/source-arg-spec-keeper";
import { ContextSpecKeeper } from "./context/context-spec-keeper";

export const RESOLVER_SPECS = Symbol.for("resolver specifications");

export interface ResolverSpec {
  method: string;
  typeFn: OutputTypeFn;
}

export interface ClassWithResolversSpecs<T> extends ClassType<T> {
  [RESOLVER_SPECS]?: Map<StringKey<T>, ResolverSpec>;
}

export class ResolverSpecStorage {
  addResolverSpec<T>(
    constructor: ClassWithResolversSpecs<T>,
    method: StringKey<T>,
    typeFn: OutputTypeFn
  ) {
    if (!constructor[RESOLVER_SPECS]) {
      constructor[RESOLVER_SPECS] = new Map();
    }
    constructor[RESOLVER_SPECS].set(method, { method, typeFn });
  }

  getResolverSpec<T>(
    constructor: ClassWithResolversSpecs<T>,
    method: StringKey<T>
  ) {
    if (!constructor[RESOLVER_SPECS]) return null;
    return constructor[RESOLVER_SPECS].get(method);
  }
}

export const WRAP_RESOLVER_SPEC = Symbol.for("wrap resolver spec");

export interface WrapResolverSpec<T> {
  method: StringKey<T>;
  wrapper: ResolverWrapCb<T, T, any>;
}

export interface ClassWithWrapSpecs<T> extends ClassType<T> {
  [WRAP_RESOLVER_SPEC]?: Map<StringKey<T>, WrapResolverSpec<T>[]>;
}

export class WrapResolverSpecStorage {
  addSpec<T>(
    constructor: ClassWithWrapSpecs<T>,
    method: StringKey<T>,
    wrapper: ResolverWrapCb<T, T, any>
  ) {
    if (!constructor[WRAP_RESOLVER_SPEC]) {
      constructor[WRAP_RESOLVER_SPEC] = new Map();
    }
    let wrapList = constructor[WRAP_RESOLVER_SPEC].get(method);
    if (!wrapList) {
      wrapList = [];
      constructor[WRAP_RESOLVER_SPEC].set(method, wrapList);
    }
    wrapList.push({ method, wrapper });
  }

  getSpecs<T>(
    constructor: ClassWithWrapSpecs<T>,
    method: StringKey<T>
  ): WrapResolverSpec<T>[] {
    if (!constructor[WRAP_RESOLVER_SPEC]) return null;
    return constructor[WRAP_RESOLVER_SPEC].get(method);
  }
}

export class ResolverBuilder {
  constructor(
    protected propertyTypeConvertor: PropertyTypeConvertor<
      ComposeOutputType<any, any>
    >,
    protected argumentsBuilder: ArgumentsBuilder,
    protected argumentsMapper: ArgumentsMapper,
    protected queueSolver: QueueSolver,
    protected storage: ResolverSpecStorage,
    protected paramsNamesKeeper: ParamsNamesKeeper,
    protected sourceArgSpecKeeper: SourceArgSpecKeeper,
    protected contextSpecKeeper: ContextSpecKeeper,
    protected schemaComposer: SchemaComposer<any>,
    protected wrapStorage: WrapResolverSpecStorage
  ) {}

  createResolver<T>(
    instance: T,
    method: StringKey<T>
  ): Resolver<any, any, any> {
    let constructor = getConstructor(instance);
    let spec = this.storage.getResolverSpec(constructor, method);
    const { typeFn } = spec;
    const type = this.propertyTypeConvertor.getPropertyType(
      constructor,
      method,
      typeFn
    );
    let args = this.argumentsBuilder.getArguments(constructor, method);
    this.queueSolver.solve();
    const paramNames = this.paramsNamesKeeper.getParamNames(
      constructor,
      method
    );
    const sourceSpec = this.sourceArgSpecKeeper.getMethodSourceArgSpec(
      constructor,
      method
    );
    const contextIndex = this.contextSpecKeeper.getContextParameterIndex(
      constructor,
      method
    );

    let resolver = new this.schemaComposer.Resolver({
      name: method,
      type,
      args,
      resolve: async rp => {
        const parameters = this.argumentsMapper.mapArguments(
          rp.args,
          paramNames
        );
        if (sourceSpec) {
          let source = rp.source;
          if (source && sourceSpec.property) {
            source = source[sourceSpec.property];
          }
          parameters[sourceSpec.parameterIndex] = source;
        }
        if (contextIndex != null) {
          parameters[contextIndex] = rp.context;
        }
        return await (instance[method] as any)(...parameters);
      }
    });
      const specs = this.wrapStorage.getSpecs(constructor, method);
      if(specs) {
          for (let wrapSpec of specs) {
              resolver = resolver.wrap(wrapSpec.wrapper);
          }
      }
    return resolver;
  }
}
