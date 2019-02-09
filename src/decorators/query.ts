import {$mount} from "./mount";
import {$resolver} from "./resolver";
import {StringKey} from "../utils";
import {OutputTypeFn} from "../graphq-compose-typescript";

export function $query(typeFn?: OutputTypeFn): PropertyDecorator {
    return <T>(target: T, key: StringKey<T>) => {
        $mount(() => 'Query')(target, key);
        $resolver(typeFn)(target, key);
    }
}
