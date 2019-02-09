import {PropertyError} from "../error";
import {ResolverBuilder} from "../resolver-builder";
import {SchemaComposer, TypeComposer} from "graphql-compose";
import {getConstructor} from "../utils";
import {TypeNameConvertor} from "./type-name-convertor";
import {MountPoint, MountPointSpecKeeper} from "./mountpoint-spec-keeper";

export class MountPointIsNull<T> extends PropertyError<T> {
    constructor(constructor, method) {
        super(constructor, method, 'Mount point cannot be null/undefined');
    }
}


export class Mounter {
    constructor(protected nameConvertor: TypeNameConvertor,
                protected resolverBuilder: ResolverBuilder,
                protected mountPointSpecKeeper: MountPointSpecKeeper) {
    }

    getTC(composer: SchemaComposer<any>, point: MountPoint): TypeComposer {
        const name = this.nameConvertor.getTypeName(point);
        return composer.getOrCreateTC(name);
    }

    mountInstances(composer: SchemaComposer<any>, instances: any[]) {
        for (const instance of instances) {
            const constructor = getConstructor(instance);
            const map = this.mountPointSpecKeeper.getMountPointsMap(constructor);
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
