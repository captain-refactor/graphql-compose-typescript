import {
    ClassType,
    getGraphqlTypeFromClass,
    getOrCreateResolver, getParameterTypesFromMetadata, setParamName, toInputType
} from "../graphq-compose-typescript";


export function $arg(name: string): ParameterDecorator {
    return (target, propertyKey: string, parameterIndex: number) => {
        const constructor: ClassType = target.constructor as any;
        let resolver = getOrCreateResolver(constructor, propertyKey);
        let params = getParameterTypesFromMetadata(constructor, propertyKey);
        resolver.addArgs({
            [name]: toInputType(getGraphqlTypeFromClass(params[parameterIndex]))
        });
        setParamName(constructor, propertyKey, name, parameterIndex);
    };
}
