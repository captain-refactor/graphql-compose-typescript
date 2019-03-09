import { ContextSpecKeeper } from "../context/context-spec-keeper";
import { getConstructor, StringKey } from "../utils";

export function $ctx(): ParameterDecorator {
  return <T>(target: T, propertyKey: StringKey<T>, parameterIndex: number) => {
    new ContextSpecKeeper().setContextParameter(
      getConstructor(target),
      propertyKey,
      parameterIndex
    );
  };
}
