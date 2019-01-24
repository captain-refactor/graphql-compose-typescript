import {ClassType, getComposer, getOrCreateComposer, getPropertyTypeFromMetadata} from "../graphq-compose-typescript";
import {ComposeOutputType} from "graphql-compose";
import {Thunk} from "graphql-compose/lib/utils/definitions";


export function $field(typeFn?: () => ComposeOutputType<any, any> | ClassType): PropertyDecorator {
    return (prototype: Object, propertyName: string) => {

        const constructor = prototype.constructor as ClassType;

        let composer = getOrCreateComposer(constructor);
        if (!composer.hasField(propertyName)) {
            const type: Thunk<ComposeOutputType<any, any>> = () => {
                if (typeFn) {
                    let providenType = typeFn();
                    if(providenType instanceof Function){
                        return getComposer(providenType)
                    }
                    return providenType;
                }
                return getPropertyTypeFromMetadata(constructor, propertyName)
            };
            composer.addFields({
                [propertyName]: {
                    type
                }
            })
        }
    };
}