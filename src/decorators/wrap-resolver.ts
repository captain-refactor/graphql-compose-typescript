import { getConstructor } from "../utils";
import { WrapResolverSpecStorage } from "../resolver-builder";
import { ResolverWrapCb } from "graphql-compose";

export function $wrapResolver<T>(
  fn: ResolverWrapCb<T, T, any>
): PropertyDecorator {
  return (target: T, propertyKey: keyof T & string) => {
    const constructor = getConstructor(target);
    new WrapResolverSpecStorage().addSpec(constructor, propertyKey, fn);
  };
}
