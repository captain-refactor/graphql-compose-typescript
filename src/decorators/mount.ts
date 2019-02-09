import {getConstructor, StringKey} from "../utils";
import {OutputTypeFn} from "../graphq-compose-typescript";
import {MountPointSpecKeeper} from "../mounting/mountpoint-spec-keeper";

export function $mount(point: OutputTypeFn) {
    return <T>(target: T, key: StringKey<T>) => {
        const constructor = getConstructor(target);
        new MountPointSpecKeeper().addMountPoint(constructor, key, point);
    };
}
