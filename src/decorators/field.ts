import {TypeFn} from "../graphq-compose-typescript";
import {getConstructor, StringKey} from "../utils";
import {FieldSpecKeeper} from "../field-spec";

let fsk = new FieldSpecKeeper();

export function $field(typeFn?: TypeFn): PropertyDecorator {
    return <T>(prototype: T, propertyName: StringKey<T>) => {
        const constructor = getConstructor(prototype);
        fsk.setType(constructor, propertyName, typeFn);
    };
}
