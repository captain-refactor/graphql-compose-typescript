import {ClassType, getOrCreateComposer} from "../graphq-compose-typescript";

export function $objectType() {
    return (target: ClassType) => {
        getOrCreateComposer(target);
    };
}
