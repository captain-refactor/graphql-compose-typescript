import {buildResolver, ClassType, TypeFn} from "../graphq-compose-typescript";

export class InstanceMissing extends Error {
    constructor(type: ClassType) {
        super(`Missing instance for ${type.name}.`);
    }
}

export function $resolver<T>(typeFn?: TypeFn): PropertyDecorator {
    return (target: T, propertyKey: string) => {
        const constructor = target.constructor as ClassType;
        buildResolver(constructor, propertyKey, typeFn)
    };
}
