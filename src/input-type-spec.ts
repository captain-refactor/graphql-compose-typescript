import {ClassType} from "./graphq-compose-typescript";

const INPUT_TYPE = Symbol.for('input type');

export class InputTypeSpecKeeper {
    markAsInputType(type: ClassType) {
        type[INPUT_TYPE] = true;
    }

    isInputType(type: ClassType) {
        return !!type[INPUT_TYPE];
    }

}