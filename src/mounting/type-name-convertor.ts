import {ClassSpecialist} from "../graphq-compose-typescript";
import {MountPoint} from "./mountpoint-spec-keeper";
import {InvalidMountPoint} from "./mounter";


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
