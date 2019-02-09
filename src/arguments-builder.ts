import {ClassType, InputTypeFn, ProvidenOutputType, OutputTypeFn} from "./graphq-compose-typescript";
import {Dict, StringKey} from "./utils";
import {ComposeFieldConfigArgumentMap} from "graphql-compose";
import {ArgumentTypeConvertor} from "./argument-type-convertor";

export const METHOD_ARGS = Symbol.for('method args');
export const PARAM_NAMES = Symbol.for('graphql parameters names');

type ArgsMap<T> = Map<StringKey<T>, Dict<InputTypeFn>>;

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

function getMethodArgs<T>(constructor: ClassMethodWithArgs<T>, method: StringKey<T>): Dict<InputTypeFn> {
    let map: ArgsMap<T> = getArgsMap(constructor);
    if (!map.has(method)) {
        map.set(method, {});
    }
    return map.get(method);
}

export function setArgumentSpec<T>(constructor: ClassMethodWithArgs<T>, method: StringKey<T>, argName: string, typeFn: InputTypeFn) {
    getMethodArgs(constructor, method)[argName] = typeFn;
}

export class ParamsNamesKeeper {
    setParamNameSpec(constructor: ClassType, property: string, name: string, index: number) {
        const propertyNames = this.getParamNames(constructor, property);
        propertyNames[index] = name;
    }

    getParamNames(constructor: ClassType, property: string): string[] {
        let method = constructor.prototype[property];
        if (!method[PARAM_NAMES]) method[PARAM_NAMES] = [];
        return method[PARAM_NAMES];
    }

    getArgumentIndex(constructor: ClassType, property: string, argument: string): number {
        return this.getParamNames(constructor, property).indexOf(argument);
    }
}

export class ArgumentsBuilder {
    constructor(protected typ: ArgumentTypeConvertor, protected paramsNamesKeeper:ParamsNamesKeeper) {
    }

    getArguments<T>(constructor: ClassMethodWithArgs<T>, method: StringKey<T>): ComposeFieldConfigArgumentMap {
        let args = getMethodArgs(constructor, method);
        let result: ComposeFieldConfigArgumentMap = {};
        for (let name of Object.keys(args)) {
            let typeFn: InputTypeFn = args[name];
            let index = this.paramsNamesKeeper.getArgumentIndex(constructor, method, name);
            result[name] = this.typ.getArgumentInputType(constructor, method, index, typeFn);
        }
        return result;
    }
}
