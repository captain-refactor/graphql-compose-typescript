import {ClassSpecialist, ClassType, ProvidenType, TypeFn} from "./graphq-compose-typescript";
import {Map, List} from "immutable";
import {getConstructor, StringKey} from "./utils";
import {SchemaComposer, TypeComposer} from "graphql-compose";
import {PropertyError} from "./error";
import {ResolverBuilder} from "./resolver-builder";

const MOUNT_POINTS = Symbol.for('mount points map');
export type MountPoint = Exclude<ProvidenType, []>;
export type MountPointFn = () => MountPoint;
type MountPoints = List<MountPointFn>;
type MountPointsMap<T> = Map<StringKey<T>, MountPoints>;

interface ClassWithMountPointsMap<T> extends ClassType<T> {
    [MOUNT_POINTS]?: MountPointsMap<T>
}

export function getMountPointsMap<T>(constructor: ClassWithMountPointsMap<T>): MountPointsMap<T> {
    return constructor[MOUNT_POINTS] || Map();
}

function setMountPointsMap<T>(constructor: ClassWithMountPointsMap<T>, map: MountPointsMap<T>) {
    return constructor[MOUNT_POINTS] = map;
}

export function addMountPoint<T>(constructor: ClassWithMountPointsMap<T>, key: StringKey<T>, point: TypeFn) {
    let map = getMountPointsMap(constructor);
    let points: MountPoints = map.get(key) || List();
    setMountPointsMap(constructor, map.set(key, points.push(point)));
}

export class MountPointIsNull<T> extends PropertyError<T> {
    constructor(constructor, method) {
        super(constructor, method, 'Mount point cannot be null/undefined');
    }
}


export class TypeNameConvertor {
    constructor(protected cls: ClassSpecialist) {
    }

    getTypeName(point: MountPoint): string {
        if (typeof point == 'string') {
            return point;
        } else if (this.cls.isClassType(point)) {
            return point.name;
        }
        return null;
    }
}

export class Mounter {
    constructor(protected nameConvertor: TypeNameConvertor,
                protected resolverBuilder: ResolverBuilder) {
    }

    getTC(composer: SchemaComposer<any>, point: MountPoint): TypeComposer {
        const name = this.nameConvertor.getTypeName(point);
        return composer.getOrCreateTC(name);
    }

    mountInstances(composer: SchemaComposer<any>, instances: any[]) {
        for (const instance of instances) {
            const constructor = getConstructor(instance);
            const map = getMountPointsMap(constructor);
            for (const [key, points] of map) {
                let resolver = this.resolverBuilder.createResolver(instance, key);
                for (const mountPointFn of points) {
                    if (!mountPointFn) throw new MountPointIsNull(constructor, key);
                    const point = mountPointFn();
                    if (!point) throw new MountPointIsNull(constructor, key);
                    this.getTC(composer, point).addFields({
                        [key]: resolver
                    })
                }
            }
        }
    }
}
