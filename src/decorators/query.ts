import {buildResolver, getOrCreateSchemaComposer, TypeFn} from "../graphq-compose-typescript";

export function $query(typeFn?: TypeFn): PropertyDecorator {
    return (target, propertyKey: string) => {
        let constructor: any = target.constructor;
        let resolver = buildResolver(constructor, propertyKey, typeFn);
        let composer = getOrCreateSchemaComposer(constructor);
        composer.Query.addRelation(propertyKey, resolver);
    };
}
