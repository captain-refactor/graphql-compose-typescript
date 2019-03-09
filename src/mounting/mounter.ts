import { GraphqlComposeTypescriptError, PropertyError } from "../error";
import { ResolverBuilder } from "../resolver-builder";
import {
  ComposeOutputType,
  SchemaComposer,
  TypeComposer
} from "graphql-compose";
import { getConstructor, isString } from "../utils";
import { MountPoint, MountPointSpecKeeper } from "./mountpoint-spec-keeper";
import { ProvidenTypeConvertor } from "../providenTypeConvertor";
import { ClassSpecialist } from "../graphq-compose-typescript";

export class MountPointIsNull<T> extends PropertyError<T> {
  constructor(constructor, method) {
    super(constructor, method, "Mount point cannot be null/undefined");
  }
}

export class InvalidMountPoint extends GraphqlComposeTypescriptError {
  constructor(public mountPoint: MountPoint) {
    super(`Invalid mount point ${mountPoint}`);
  }
}

export class Mounter {
  constructor(
    protected typeConvertor: ProvidenTypeConvertor<ComposeOutputType<any, any>>,
    protected resolverBuilder: ResolverBuilder,
    protected classSpecialist: ClassSpecialist,
    protected mountPointSpecKeeper: MountPointSpecKeeper
  ) {}

  getTC(composer: SchemaComposer<any>, point: MountPoint): TypeComposer {
    if (this.classSpecialist.isClassType(point)) {
      return this.typeConvertor.classToComposeType(point) as TypeComposer;
    } else if (isString(point)) {
      return composer.getOrCreateTC(point);
    } else if (Array.isArray(point)) {
      throw new InvalidMountPoint(point);
    } else {
      return point as any;
    }
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
          });
        }
      }
    }
  }
}
