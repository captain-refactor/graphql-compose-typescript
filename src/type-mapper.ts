import {ProvidenTypeConvertor} from "./providenTypeConvertor";
import {PropertyTypeKeeper} from "./metadata";
import {ComposeInputType, ComposeOutputType} from "graphql-compose";
import {StringKey} from "./utils";
import {ArrayTypeNotSpecified, ClassType, ProvidenType, TypeFn, TypeNotSpecified} from "./graphq-compose-typescript";

export class TypeMapper {
    constructor(protected providenTypeConvertor: ProvidenTypeConvertor,
                protected propertyTypeKeeper: PropertyTypeKeeper) {
    }

    getPropertyOutputType(constructor: ClassType, key: string, typeFn?: TypeFn): ComposeOutputType<any, any> {
        let providenType: ProvidenType = typeFn && typeFn();
        let typeClass: ClassType = this.propertyTypeKeeper.getPropertyType(constructor, key);
        if (typeClass == Promise && !providenType) {
            throw new TypeNotSpecified(constructor, key);
        }
        if (typeClass == Array) {
            if (!providenType) throw new ArrayTypeNotSpecified(constructor, key);
            if (!Array.isArray(providenType)) {
                providenType = [providenType] as ProvidenType;
            }
        }
        let result = providenType || typeClass;
        if (!result) throw new TypeNotSpecified(constructor, key);
        return this.providenTypeConvertor.mapToOutputType(result);
    }

    getPropertyInputType<T>(constructor: ClassType<T>, key: StringKey<T>, typeFn: TypeFn): ComposeInputType {
        let providenType = typeFn && typeFn();
        let typeClass: ClassType = this.propertyTypeKeeper.getPropertyType(constructor, key);
        if (typeClass == Array) {
            if (!providenType) throw new ArrayTypeNotSpecified(constructor, key);
            if (!Array.isArray(providenType)) {
                providenType = [providenType] as ProvidenType;
            }
        }
        let result = providenType || typeClass;
        if (!result) throw new TypeNotSpecified(constructor, key);
        return this.providenTypeConvertor.mapToInputType(result);
    }


    getArgumentInputType<T>(constructor: ClassType<T>, key: StringKey<T>, index: number, typeFn: TypeFn): ComposeInputType {
        let providenType = typeFn && typeFn();
        let typeClass: ClassType = this.propertyTypeKeeper.getParameterType(constructor, key, index);
        if (typeClass == Array) {
            if (!providenType) throw new ArrayTypeNotSpecified(constructor, key);
            if (!Array.isArray(providenType)) {
                providenType = [providenType] as ProvidenType;
            }
        }
        let result = providenType || typeClass;
        if (!result) throw new TypeNotSpecified(constructor, key);
        return this.providenTypeConvertor.mapToInputType(result);
    }
}
