import {getConstructor, StringKey} from "../utils";
import {TypeFn} from "../graphq-compose-typescript";
import {addMountPoint} from "../mounting";

export function $mount(point: TypeFn) {
    return <T>(target: T, key: StringKey<T>) => {
        const constructor = getConstructor(target);
        addMountPoint(constructor, key, point);
    };
}
