import {TypeFn} from "../graphq-compose-typescript";
import {setArgumentSpec, setParamNameSpec} from "../arguments-builder";
import {getParameterTypesFromMetadata} from "../metadata";


export function $arg(name: string, typeFn?: TypeFn): ParameterDecorator {
    return (target, propertyKey: string, parameterIndex: number) => {
        const constructor = target.constructor as any;
        let params = getParameterTypesFromMetadata(constructor, propertyKey);
        setArgumentSpec(constructor, propertyKey, name, typeFn ? typeFn() : params[parameterIndex]);
        setParamNameSpec(constructor, propertyKey, name, parameterIndex);
    };
}
