import {ClassType, TypeFn} from "./graphq-compose-typescript";
import {Map} from 'immutable';
import {StringKey} from "./utils";

const FIELD_TYPES = Symbol.for('field types map');


export class FieldSpecKeeper {
    isDecorated(constructor: ClassType): boolean {
        return !!constructor[FIELD_TYPES];
    }

    setType<T>(constructor: ClassType<T>, name: StringKey<T>, type: TypeFn) {
        this.setFieldTypes(constructor, this.getFieldTypes(constructor).set(name, type));
    }

    getFieldTypes<T>(constructor: ClassType<T>): Map<StringKey<T>, TypeFn> {
        let map = constructor[FIELD_TYPES];
        return map || Map();
    }

    protected setFieldTypes<T>(constructor: ClassType<T>, types: Map<StringKey<T>, TypeFn>) {
        constructor[FIELD_TYPES] = types;
    }
}
