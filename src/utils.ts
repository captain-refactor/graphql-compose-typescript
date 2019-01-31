import {ClassType} from "./graphq-compose-typescript";

export type Dict<T, K extends string = string> = { [key in K]: T };

export type StringKey<T> = (keyof T) & string;

export function getConstructor<T>(instance: T): ClassType<T> {
    return instance.constructor as any;
}
