import {PropertyTypeKeeper} from "./metadata";
import {ComposeInputType} from "graphql-compose";
import {StringKey} from "./utils";
import {
    ArrayTypeNotSpecified,
    ClassType,
    InputTypeFn, ProvidenInputType,
    ProvidenOutputType,
    TypeNotSpecified, TypeFn, ProvidenType
} from "./graphq-compose-typescript";
import {ComposeType, ProvidenTypeConvertor} from "./providenTypeConvertor";


export class PropertyTypeConvertor<T extends ComposeType> {
    constructor(protected typeConvertor: ProvidenTypeConvertor<T>,
                protected propertyTypeKeeper: PropertyTypeKeeper) {
    }

    getPropertyType(constructor: ClassType, key: string, typeFn?: TypeFn): T {
        let providenType: ProvidenType = typeFn && typeFn();
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
        return this.typeConvertor.toComposeType(result);
    }
}

export class ArgumentTypeConvertor {
    constructor(protected propertyTypeKeeper: PropertyTypeKeeper,
                protected typeConvertor: ProvidenTypeConvertor<ComposeInputType>) {
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
        return this.typeConvertor.toComposeType(result);
    }

}
