import {ClassType} from "./graphq-compose-typescript";
import {StringKey} from "./utils";

export class PropertyTypeKeeper {

    isMethod<T>(constructor: ClassType<T>, name: StringKey<T>): boolean {
        return this.getPropertyTypeFromMetadata(constructor, name) == Function;
    }

    getPropertyType(constructor: ClassType, property: string): ClassType {
        const typeClass = this.getPropertyTypeFromMetadata(constructor, property);
        if (typeClass == Function) {
            return this.getReturnTypeFromMetadata(constructor, property);
        }
        return typeClass;
    }

    getPropertyTypeFromMetadata(constructor: ClassType, property: string) {
        return Reflect.getMetadata('design:type', constructor.prototype, property);
    }

    getReturnTypeFromMetadata(constructor: ClassType, property: string): ClassType {
        return Reflect.getMetadata('design:returntype', constructor.prototype, property);
    }

    getParameterTypesFromMetadata(constructor: ClassType, property: string): ClassType[] {
        return Reflect.getMetadata('design:paramtypes', constructor.prototype, property);
    }
}
