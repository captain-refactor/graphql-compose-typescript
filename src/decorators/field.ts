import {
    ClassType,
    getComposer,
    getOrCreateComposer, getParamNames,
    getPropertyGraphqlType,
    getPropertyType, mapArguments
} from "../graphq-compose-typescript";
import {ComposeOutputType} from "graphql-compose";
import {Thunk} from "graphql-compose/lib/utils/definitions";
import {GraphQLFieldResolver} from "graphql";


export function $field(typeFn?: () => ComposeOutputType<any, any> | ClassType): PropertyDecorator {
    return (prototype: Object, propertyName: string) => {

        const constructor = prototype.constructor as ClassType;

        let composer = getOrCreateComposer(constructor);
        if (!composer.hasField(propertyName)) {
            const type: Thunk<ComposeOutputType<any, any>> = () => {
                if (typeFn) {
                    let providenType = typeFn();
                    if (providenType instanceof Function) {
                        return getComposer(providenType)
                    }
                    return providenType;
                }
                return getPropertyGraphqlType(constructor, propertyName)
            };
            const propertyType = getPropertyType(constructor, propertyName);
            if (propertyType === Function) {
                let resolver = composer.getResolver(propertyName);
                resolver.setType(type());
                resolver.setResolve(async rp => {
                    let parameters = mapArguments(rp.args, getParamNames(constructor, propertyName));
                    return await rp.source[propertyName](...parameters);
                });
                composer.addRelation(propertyName, resolver);
            }else{
                composer.addFields({
                    [propertyName]: {
                        type,
                    }
                })
            }

        }
    };
}