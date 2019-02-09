import {ClassType} from "../graphq-compose-typescript";
import {StringKey} from "../utils";
import {Map} from 'immutable';

const SOURCE_CONFIG_MAP = Symbol.for('source config map');

export interface SourceSpec {
    parameterIndex: number;
    property: string;
}

type SourceConfigMap<T> = Map<StringKey<T>, SourceSpec>;

export interface ClassWithSourceConfig<T> extends ClassType<T> {
    [SOURCE_CONFIG_MAP]?: SourceConfigMap<T>
}

export class SourceArgSpecKeeper {

    protected getConfigMap<T>(type: ClassWithSourceConfig<T>): SourceConfigMap<T> {
        if (!type.hasOwnProperty(SOURCE_CONFIG_MAP)) return Map();
        return type[SOURCE_CONFIG_MAP];
    }

    protected setConfigMap<T>(type: ClassWithSourceConfig<T>, map: SourceConfigMap<T>) {
        return type[SOURCE_CONFIG_MAP] = map;
    }

    addSourceArgSpec<T>(constructor: ClassType<T>, method: StringKey<T>, spec: SourceSpec) {
        this.setConfigMap(constructor, this.getConfigMap(constructor).set(method, spec));
    }

    getMethodSourceArgSpec<T>(constructor: ClassType<T>, method: StringKey<T>) {
        return this.getConfigMap(constructor).get(method);
    }

}
