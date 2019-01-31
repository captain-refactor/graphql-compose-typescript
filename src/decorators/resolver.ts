import {TypeFn} from "../graphq-compose-typescript";
import {addResolverSpec} from "../resolver-builder";
import {getConstructor} from "../utils";

export function $resolver<T>(typeFn?: TypeFn): PropertyDecorator {
    return (target: T, propertyKey: keyof T & string) => {
        const constructor = getConstructor(target);
        addResolverSpec(constructor, propertyKey, typeFn);
    };
}
