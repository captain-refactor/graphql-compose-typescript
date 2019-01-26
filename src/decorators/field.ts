import {
    ClassType,
    getOrCreateComposer, getOrCreateResolver, getParamNames,
    getPropertyGraphqlType,
    getPropertyType, mapArguments, TypeFn
} from "../graphq-compose-typescript";


export function $field(typeFn?: TypeFn): PropertyDecorator {
    return (prototype: Object, propertyName: string) => {

        const constructor = prototype.constructor as ClassType;

        let composer = getOrCreateComposer(constructor);
        if (!composer.hasField(propertyName)) {
            let type = getPropertyGraphqlType(constructor, propertyName, typeFn);
            const propertyType = getPropertyType(constructor, propertyName);
            if (propertyType === Function) {
                let resolver = getOrCreateResolver(constructor, propertyName);
                resolver.setType(type);
                resolver.setResolve(async rp => {
                    let parameters = mapArguments(rp, getParamNames(constructor, propertyName));
                    return await rp.source[propertyName](...parameters);
                });
                composer.addRelation(propertyName, resolver);
            } else {
                composer.addFields({
                    [propertyName]: {
                        type,
                    }
                })
            }

        }
    };
}
