import {ClassType} from "./graphq-compose-typescript";
import {StringKey} from "./utils";

const SOURCE_PARAMETER = Symbol.for('source parameter map');

interface ClassWithSourceParameterMap<T> extends ClassType<T> {
    [SOURCE_PARAMETER]?: Map<StringKey<T>, Map<number, string>>;
}

export function setSourceParameter<T>(constructor: ClassType<T>, key: StringKey<T>, index: number, provideProperty: string) {

}
