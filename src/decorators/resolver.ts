import {
    ClassType,
    DefaultContext, getComposer,
    getOrCreateComposer, getOrCreateResolver, getParamNames,
    getPropertyGraphqlType,
    mapArguments, TypeFn
} from "../graphq-compose-typescript";
import {ComposeOutputType, Resolver} from "graphql-compose";

export class InstanceMissing extends Error {
    constructor(type: ClassType) {
        super(`Missing instance for ${type.name}.`);
    }

}

export function $resolver<T>(typeFn?: TypeFn): PropertyDecorator {
    return (target: T, propertyKey: string) => {
        const constructor = target.constructor as ClassType;
        let resolver = getOrCreateResolver(constructor, propertyKey);
        resolver.setType(getPropertyGraphqlType(constructor, propertyKey, typeFn));
        resolver.setResolve(function (rp) {
            const instance = rp.context.instance;
            if (!instance) {
                throw new InstanceMissing(constructor);
            }
            let parameters = mapArguments(rp, getParamNames(constructor, propertyKey));
            return instance[propertyKey](...parameters);
        });
    };
}
