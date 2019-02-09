import {ProvidenTypeConvertor} from "./providenTypeConvertor";
import {PropertyTypeKeeper} from "./metadata";
import {ComposeInputType, ComposeOutputType} from "graphql-compose";
import {StringKey} from "./utils";
import {
    ArrayTypeNotSpecified,
    ClassType,
    InputTypeFn, ProvidenInputType,
    ProvidenOutputType,
    OutputTypeFn,
    TypeNotSpecified
} from "./graphq-compose-typescript";

export class TypeMapper {
    constructor(protected providenTypeConvertor: ProvidenTypeConvertor,
                protected propertyTypeKeeper: PropertyTypeKeeper) {
    }

    getPropertyOutputType(constructor: ClassType, key: string, typeFn?: OutputTypeFn): ComposeOutputType<any, any> {
        let providenType: ProvidenOutputType = typeFn && typeFn();
        let typeClass: ClassType = this.propertyTypeKeeper.getPropertyType(constructor, key);
        if (typeClass == Promise && !providenType) {
            throw new TypeNotSpecified(constructor, key);
        }
        if (typeClass == Array) {
            if (!providenType) throw new ArrayTypeNotSpecified(constructor, key);
            if (!Array.isArray(providenType)) {
                providenType = [providenType] as ProvidenOutputType;
            }
        }
        let result = providenType || typeClass;
        if (!result) throw new TypeNotSpecified(constructor, key);
        return this.providenTypeConvertor.mapToOutputType(result);
    }

    getPropertyInputType<T>(constructor: ClassType<T>, key: StringKey<T>, typeFn: InputTypeFn): ComposeInputType {
        let providenType = typeFn && typeFn();
        let typeClass: ClassType = this.propertyTypeKeeper.getPropertyType(constructor, key);
        if (typeClass == Array) {
            if (!providenType) throw new ArrayTypeNotSpecified(constructor, key);
            if (!Array.isArray(providenType)) {
                providenType = [providenType] as ProvidenInputType;
            }
        }
        let result = providenType || typeClass;
        if (!result) throw new TypeNotSpecified(constructor, key);
        return this.providenTypeConvertor.mapToInputType(result);
    }


    getArgumentInputType<T>(constructor: ClassType<T>, key: StringKey<T>, index: number, typeFn: InputTypeFn): ComposeInputType {
        let providenType = typeFn && typeFn();
        let typeClass: ClassType = this.propertyTypeKeeper.getParameterType(constructor, key, index);
        if (typeClass == Array) {
            if (!providenType) throw new ArrayTypeNotSpecified(constructor, key);
            if (!Array.isArray(providenType)) {
                providenType = [providenType] as ProvidenInputType;
            }
        }
        let result = providenType || typeClass;
        if (!result) throw new TypeNotSpecified(constructor, key);
        return this.providenTypeConvertor.mapToInputType(result);
    }

}
