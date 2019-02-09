import {OutputTypeFn} from "../graphq-compose-typescript";
import {getConstructor} from "../utils";
import {ResolverSpecStorage} from "../resolver-builder";

export function $resolver<T>(typeFn?: OutputTypeFn): PropertyDecorator {
    return (target: T, propertyKey: keyof T & string) => {
        const constructor = getConstructor(target);
        new ResolverSpecStorage().addResolverSpec(constructor, propertyKey, typeFn);
    };
}
