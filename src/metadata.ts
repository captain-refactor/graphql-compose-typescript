import {ClassType} from "./graphq-compose-typescript";

export function getReturnTypeFromMetadata(constructor: ClassType, property: string): ClassType {
    return Reflect.getMetadata('design:returntype', constructor.prototype, property);
}

export function getParameterTypesFromMetadata(constructor: ClassType, property: string): ClassType[] {
    return Reflect.getMetadata('design:paramtypes', constructor.prototype, property);
}
