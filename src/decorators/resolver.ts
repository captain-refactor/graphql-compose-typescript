import {ClassType, getOrCreateComposer} from "../graphq-compose-typescript";
import {Resolver} from "graphql-compose";

export function $resolver<T>(): PropertyDecorator {
    return (target: T, propertyKey) => {
        const constructor = target.constructor as ClassType;
        let composer = getOrCreateComposer(constructor);
        let resolver = new Resolver({
            name: propertyKey.toString(),
        });
        composer.addResolver(resolver);
    };
}