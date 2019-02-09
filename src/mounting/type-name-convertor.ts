import {ClassSpecialist} from "../graphq-compose-typescript";
import {MountPoint} from "./mountpoint-spec-keeper";

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
