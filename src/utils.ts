import {ClassType} from "./graphq-compose-typescript";
import {InputTypeComposer, TypeComposer} from "graphql-compose";

export type Dict<T, K extends string = string> = { [key in K]: T };

export type StringKey<T> = (keyof T) & string;

export function getConstructor<T>(instance: T): ClassType<T> {
    return instance.constructor as any;
}

export type IOComposers = TypeComposer | InputTypeComposer;

export function isString(obj: any): obj is string {
    return typeof obj === 'string' || obj instanceof String;
}
