import {ClassSpecialist, ClassType} from "./graphq-compose-typescript";

const TYPE_NAME = Symbol.for('type name');

export class TypeNameKeeper {
    constructor(protected cl: ClassSpecialist) {
    }

    getTypeName(type: ClassType): string {
        return type[TYPE_NAME] || type.name;
    }
}
