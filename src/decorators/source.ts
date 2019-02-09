import {getConstructor, StringKey} from "../utils";
import {$arg} from "./arg";

export function $source<T = any>(property?: string) {
    return (target: T, propertyKey: StringKey<T>, parameterIndex: number) => {

    };
}
