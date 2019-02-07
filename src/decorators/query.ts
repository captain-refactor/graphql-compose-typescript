import {$mount} from "./mount";
import {$resolver} from "./resolver";
import {StringKey} from "../utils";
import {TypeFn} from "../graphq-compose-typescript";

export function $query(typeFn?: TypeFn): PropertyDecorator {
    return <T>(target: T, key: StringKey<T>) => {
        $mount(() => 'Query')(target, key);
        $resolver(typeFn)(target, key);
    }
}
