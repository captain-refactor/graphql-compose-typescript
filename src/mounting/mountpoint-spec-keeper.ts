import {ClassType, OutputTypeFn, ProvidenOutputType} from "../graphq-compose-typescript";
import {StringKey} from "../utils";
import {List, Map} from "immutable";

export type MountPoint = Exclude<ProvidenOutputType, []>;
export type MountPointFn = () => MountPoint;
const MOUNT_POINTS = Symbol.for('mount points map');
type MountPoints = List<MountPointFn>;
type MountPointsMap<T> = Map<StringKey<T>, MountPoints>;

interface ClassWithMountPointsMap<T> extends ClassType<T> {
    [MOUNT_POINTS]?: MountPointsMap<T>
}

export class MountPointSpecKeeper{
    private setMountPointsMap<T>(constructor: ClassWithMountPointsMap<T>, map: MountPointsMap<T>) {
        return constructor[MOUNT_POINTS] = map;
    }
    addMountPoint<T>(constructor: ClassWithMountPointsMap<T>, key: StringKey<T>, point: OutputTypeFn) {
        let map = this.getMountPointsMap(constructor);
        let points: MountPoints = map.get(key) || List();
        this.setMountPointsMap(constructor, map.set(key, points.push(point)));
    }
    getMountPointsMap<T>(constructor: ClassWithMountPointsMap<T>): MountPointsMap<T> {
        return constructor[MOUNT_POINTS] || Map();
    }
}
