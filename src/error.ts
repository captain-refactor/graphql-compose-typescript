import {ClassType} from "./graphq-compose-typescript";
import {StringKey} from "./utils";

export class GraphqlComposeTypescriptError extends Error {
}

export class PropertyError<T> extends GraphqlComposeTypescriptError {
    constructor(constructor: ClassType<T>, key: StringKey<T>, message: string) {
        super(`[${constructor.name}.${key}]: ${message}`);
    }

}
