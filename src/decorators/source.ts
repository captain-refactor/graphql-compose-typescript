import {getConstructor, StringKey} from "../utils";

export function $source<T = any>(property?: string) {
    return (target: T, propertyKey: StringKey<T>, parameterIndex: number) => {
        const constructor = getConstructor(target);

    };
}
