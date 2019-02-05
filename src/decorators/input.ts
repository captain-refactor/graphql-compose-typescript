import {ClassType} from "../graphq-compose-typescript";
import {InputTypeSpecKeeper} from "../input-type-spec";

let specKeeper = new InputTypeSpecKeeper();

export function $input() {
    return (constructor: ClassType) => {
        specKeeper.markAsInputType(constructor);
    };
}
