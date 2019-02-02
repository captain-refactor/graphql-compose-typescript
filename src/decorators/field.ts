import {TypeFn} from "../graphq-compose-typescript";
import {setType} from "../field-spec";
import {getConstructor, StringKey} from "../utils";


export function $field(typeFn?: TypeFn): PropertyDecorator {
    return <T>(prototype: T, propertyName: StringKey<T>) => {
        const constructor = getConstructor(prototype);
        setType(constructor, propertyName, typeFn);
    };
}
