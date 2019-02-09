import {getConstructor, StringKey} from "../utils";
import {SourceArgSpecKeeper} from "../resolver/source-arg-spec-keeper";

export function $source<T = any>(property?: string) {
    return (target: T, propertyKey: StringKey<T>, parameterIndex: number) => {
        new SourceArgSpecKeeper().addSourceArgSpec(getConstructor(target), propertyKey, {
            parameterIndex,
            property
        })
    };
}
