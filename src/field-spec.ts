import {ClassType, TypeFn} from "./graphq-compose-typescript";
import {Map} from 'immutable';
import {StringKey} from "./utils";

const FIELD_TYPES = Symbol.for('field types map');

export function getFieldTypes<T>(constructor: ClassType<T>): Map<StringKey<T>, TypeFn> {
    let map = constructor[FIELD_TYPES];
    return map || Map();
}

function setFieldTypes<T>(constructor: ClassType<T>, types: Map<StringKey<T>, TypeFn>) {
    constructor[FIELD_TYPES] = types;
}

export function setType<T>(constructor: ClassType<T>, name: StringKey<T>, type: TypeFn) {
    setFieldTypes(constructor, getFieldTypes(constructor).set(name, type));
}

export function isDecorated(constructor: ClassType): boolean {
    return !!constructor[FIELD_TYPES];
}
