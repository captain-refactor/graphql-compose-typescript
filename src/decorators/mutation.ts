import {TypeFn} from "../graphq-compose-typescript";
import {StringKey} from "../utils";
import {$mount} from "./mount";
import {$resolver} from "./resolver";

export function $mutation(typeFn?: TypeFn): PropertyDecorator {
    return <T>(target: T, key: StringKey<T>) => {
        $mount(() => 'Mutation')(target, key);
        $resolver(typeFn)(target, key);
    }
}
