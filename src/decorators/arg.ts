import { InputTypeFn, OutputTypeFn } from "../graphq-compose-typescript";
import { ParamsNamesKeeper, setArgumentSpec } from "../arguments-builder";

let paramsNamesKeeper = new ParamsNamesKeeper();

export function $arg(name: string, typeFn?: InputTypeFn): ParameterDecorator {
  return (target, propertyKey: string, parameterIndex: number) => {
    const constructor = target.constructor as any;
    setArgumentSpec(constructor, propertyKey, name, typeFn);
    paramsNamesKeeper.setParamNameSpec(
      constructor,
      propertyKey,
      name,
      parameterIndex
    );
  };
}
