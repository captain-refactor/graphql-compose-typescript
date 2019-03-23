import { ContextSpecKeeper } from "../context/context-spec-keeper";
import { getConstructor, StringKey } from "../utils";

export function $ctx(get?: string): ParameterDecorator {
  return <T>(target: T, propertyKey: StringKey<T>, position: number) => {
    new ContextSpecKeeper().setContextParameter(
      getConstructor(target),
      propertyKey,
      { get, position }
    );
  };
}
