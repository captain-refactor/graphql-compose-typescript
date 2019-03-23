import { ClassType } from "../graphq-compose-typescript";
import { StringKey } from "../utils";
import { Map } from "immutable";

const CONTEXT_PARAMETER = Symbol.for("context parameter");

export interface CtxConfig {
  position: number;
  get: string;
}

type ContextMap<T> = Map<StringKey<T>, CtxConfig>;

interface ClassWithContextMap<T> extends ClassType<T> {
  [CONTEXT_PARAMETER]?: ContextMap<T>;
}

export class ContextSpecKeeper {
  private setContextMap<T>(type: ClassWithContextMap<T>, map: ContextMap<T>) {
    type[CONTEXT_PARAMETER] = map;
  }

  private getContextMap<T>(type: ClassWithContextMap<T>): ContextMap<T> {
    return type[CONTEXT_PARAMETER] || Map();
  }

  setContextParameter<T>(
    type: ClassWithContextMap<T>,
    method: StringKey<T>,
    config: CtxConfig
  ) {
    this.setContextMap(type, this.getContextMap(type).set(method, config));
  }
  getContextParameterIndex<T>(
    type: ClassWithContextMap<T>,
    method: StringKey<T>
  ) {
    return this.getContextMap(type).get(method);
  }
}
