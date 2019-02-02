import {ClassType} from "./graphq-compose-typescript";

export type Dict<T, K extends string = string> = { [key in K]: T };

export type StringKey<T> = (keyof T) & string;

export function getConstructor<T>(instance: T): ClassType<T> {
    return instance.constructor as any;
}

const functionProto = Object.getPrototypeOf(Function);

export function getSuper(type: ClassType): ClassType {
    let proto = Object.getPrototypeOf(type);
    if (proto === functionProto) return null;
    return proto;
}

export function* protoChain(type: ClassType) {
    while (true) {
        yield type;
        type = getSuper(type);
        if (!type) break;
    }
}