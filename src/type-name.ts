import {ClassSpecialist, ClassType} from "./graphq-compose-typescript";
import {InputTypeSpecKeeper} from "./input-type-spec";

const TYPE_NAME = Symbol.for('constructor name');

export class TypeNameKeeper {
    constructor(protected inputTypeSpecKeeper: InputTypeSpecKeeper) {
    }

    getTypeName(type: ClassType): string {
        let name = type[TYPE_NAME] || type.name;
        if (!this.inputTypeSpecKeeper.isInputType(type)) {
            return name;
        } else {
            return `${name}Output`;
        }
    }

    getInputTypeName(type: ClassType): string {
        let name = type[TYPE_NAME] || type.name;
        if (this.inputTypeSpecKeeper.isInputType(type)) {
            return name;
        } else {
            return `${name}Input`;
        }
    }
}
