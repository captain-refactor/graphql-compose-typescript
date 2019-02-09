import {ClassType, DefaultContext, InputTypeFn, mapArguments, OutputTypeFn, TypeFn} from "../graphq-compose-typescript";
import {StringKey} from "../utils";
import {ArgumentTypeConvertor, PropertyTypeConvertor} from "../argument-type-convertor";
import {
    ComposeFieldConfig,
    ComposeInputFieldConfig,
    ComposeInputType,
    ComposeOutputType,
    SchemaComposer
} from "graphql-compose";
import {ArgumentsBuilder, ParamsNamesKeeper} from "../arguments-builder";
import {PropertyTypeKeeper} from "../metadata";
import {GraphQLFieldResolver} from "graphql";

export interface FieldCreator {
    createField<T>(constructor: ClassType<T>, typeFn: TypeFn, key: StringKey<T>)
}

export class OutputFieldCreator implements FieldCreator {

    constructor(protected argumentsBuilder: ArgumentsBuilder,
                protected propertyTypeConvertor: PropertyTypeConvertor<ComposeOutputType<any, any>>,
                protected propertyTypeKeeper: PropertyTypeKeeper,
                protected schemaComposer: SchemaComposer<any>,
                protected paramsNamesKeeper: ParamsNamesKeeper) {
    }

    protected createResolver<T>(constructor: ClassType<T>, key: StringKey<T>): GraphQLFieldResolver<T, any> {
        let paramsNamesKeeper = this.paramsNamesKeeper;
        return (source: T, args) => {
            let method: Function = constructor.prototype[key] as any;
            return method.bind(source)(...mapArguments(args, paramsNamesKeeper.getParamNames(constructor, key)));
        };
    }

    createField<T>(constructor: ClassType<T>, typeFn: OutputTypeFn, key): ComposeFieldConfig<T, DefaultContext<T>> {
        let args = this.argumentsBuilder.getArguments(constructor, key);
        let type: ComposeOutputType<any, any> = this.propertyTypeConvertor.getPropertyType(constructor, key, typeFn);
        let resolve = this.propertyTypeKeeper.isMethod(constructor, key) ? this.createResolver(constructor, key) : undefined;
        return {
            type,
            args,
            resolve
        };
    }
}


export class InputFieldCreator implements FieldCreator {

    constructor(protected typeMapper: PropertyTypeConvertor<ComposeInputType>,
                protected schemaComposer: SchemaComposer<any>) {
    }

    createField<T>(constructor: ClassType<T>, typeFn: InputTypeFn, key: StringKey<T>): ComposeInputFieldConfig {
        const type = this.typeMapper.getPropertyType(constructor, key, typeFn);
        return {
            type
        }
    }
}

