import {ClassType, ProvidenType, TypeMapper} from "./graphq-compose-typescript";
import {Dict, StringKey} from "./utils";
import {ComposeFieldConfigArgumentMap} from "graphql-compose";

export const METHOD_ARGS = Symbol.for('method args');
export const PARAM_NAMES = Symbol.for('graphql parameters names');

type ArgsMap<T> = Map<StringKey<T>, Dict<ProvidenType>>;

export interface ClassMethodWithArgs<T> extends ClassType<T> {
    [METHOD_ARGS]?: ArgsMap<T>
    [PARAM_NAMES]?: string[]
}

function getArgsMap<T>(constructor: ClassMethodWithArgs<T>) {
    let map = constructor[METHOD_ARGS];
    if (!map) {
        map = new Map();
        constructor[METHOD_ARGS] = map;
    }
    return map;
}

function getMethodArgs<T>(constructor: ClassMethodWithArgs<T>, method: StringKey<T>): Dict<ProvidenType> {
    let map: ArgsMap<T> = getArgsMap(constructor);
    if (!map.has(method)) {
        map.set(method, {});
    }
    return map.get(method);
}

export function setArgumentSpec<T>(constructor: ClassMethodWithArgs<T>, method: StringKey<T>, argName: string, type: ProvidenType) {
    getMethodArgs(constructor, method)[argName] = type;
}


export function setParamNameSpec(constructor: ClassType, property: string, name: string, index: number) {
    const propertyNames = getParamNames(constructor, property);
    propertyNames[index] = name;
}

export function getParamNames(constructor: ClassType, property: string): string[] {
    let method = constructor.prototype[property];
    if (!method[PARAM_NAMES]) method[PARAM_NAMES] = [];
    return method[PARAM_NAMES];
}

export class ArgumentsBuilder {
    constructor(protected typeMapper: TypeMapper) {
    }

    getArguments<T>(constructor: ClassMethodWithArgs<T>, method: StringKey<T>): ComposeFieldConfigArgumentMap {
        let args = getMethodArgs(constructor, method);
        let result: ComposeFieldConfigArgumentMap = {};
        for (let name of Object.keys(args)) {
            let type: ProvidenType = args[name];
            result[name] = this.typeMapper.toInputType(this.typeMapper.mapOutputType(type));
        }
        return result;
    }
}
