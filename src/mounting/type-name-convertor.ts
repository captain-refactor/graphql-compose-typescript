import {ClassSpecialist} from "../graphq-compose-typescript";
import {MountPoint} from "./mountpoint-spec-keeper";
import {GraphqlComposeTypescriptError} from "../error";

export class InvalidMountPoint extends GraphqlComposeTypescriptError {
    constructor(public mountPoint: MountPoint) {
        super(`Invalid mount point ${mountPoint}`)
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
        throw new InvalidMountPoint(point);
    }
}
