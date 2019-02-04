import {
    ComposeInputType,
    ComposeOutputType,
    Resolver,
    schemaComposer,
    SchemaComposer,
    TypeComposer
} from "graphql-compose";
import {getReturnTypeFromMetadata} from "./metadata";
import {AnnotatedClass, TypeComposerCreator} from "./object-type-composition";
import {StringKey} from "./utils";
import {Mounter, TypeNameConvertor} from "./mounting";
import {ArgumentsBuilder} from "./arguments-builder";
import {ResolverBuilder, ResolverSpecStorage} from "./resolver-builder";
import {FieldSpecKeeper} from "./field-spec";
import {Queue} from "./class-type/queue";
import {TypeNameKeeper} from "./type-name";
import {QueueSolver} from "./class-type/queue-solver";

export type ProvidenType = ComposeOutputType<any, any> | ClassType | [ClassType];

export type TypeFn = () => ProvidenType;

export interface DefaultContext<T> {

}

export function mapArguments(args: any, paramNames: string[]): any[] {
    if (paramNames.length === 0) return [];
    args = args || {};
    let parameters = [];
    for (const name of paramNames) {
        parameters.push(args[name]);
    }
    return parameters;
}


export class TypeNotSpecified extends Error {
    constructor(constructor: Function, propertyName: string) {
        super(`${constructor.name}.${propertyName} does not have specified type`);
    }
}

export class ArrayTypeNotSpecified extends Error {
    constructor(constructor: Function, propertyName: string) {
        super(`${constructor.name}.${propertyName} does not have specified array item type`);
    }
}

export class ClassSpecialist {
    isClassType(type: ProvidenType): type is ClassType<any> {
        return type instanceof Function;
    }

    isArrayClassType(type: ProvidenType): type is [ClassType<any>] {
        return Array.isArray(type) && this.isClassType(type[0]);
    }
}

export class TypeMapper {
    constructor(protected fieldSpec: FieldSpecKeeper,
                protected classSpec: ClassSpecialist,
                protected nk: TypeNameKeeper,
                protected resolutionQueue: Queue,
                protected propertyTypeKeeper: PropertyTypeKeeper) {
    }

    toInputType(type: ComposeOutputType<any, any, any>): ComposeInputType {
        if ((type as TypeComposer).getInputType) {
            return (type as TypeComposer).getInputType();
        }
        return type as ComposeInputType;

    }

    getComposeOutputType(typeClass: ClassType): ComposeOutputType<any, any> | null {
        if (!typeClass) return null;
        if (typeClass === Number) {
            return 'Float';
        } else if (this.fieldSpec.isDecorated(typeClass)) {
            this.resolutionQueue.add(typeClass);
            return this.nk.getTypeName(typeClass);
        } else {
            return typeClass.name;
        }
    }

    mapOutputType(type: ProvidenType): ComposeOutputType<any, any> | null {
        if (!type) return null;
        if (this.classSpec.isClassType(type)) {
            return this.getComposeOutputType(type);
        } else if (this.classSpec.isArrayClassType(type)) {
            return [this.getComposeOutputType(type[0]) as any]
        } else {
            return type;
        }
    }

    getPropertyGraphqlType(constructor: ClassType, property: string, providenTypeFn?: TypeFn): ComposeOutputType<any, any> {
        let providenType: ComposeOutputType<any, any> = this.mapOutputType(providenTypeFn && providenTypeFn());

        let typeClass: ClassType = this.propertyTypeKeeper.getPropertyType(constructor, property);

        if (typeClass == Function) {
            typeClass = getReturnTypeFromMetadata(constructor, property);
        }

        if (typeClass == Promise && !providenType) {
            throw new TypeNotSpecified(constructor, property);
        }

        if (typeClass == Array) {
            this.handleArrayType(constructor, property, providenType);
        }
        let result = providenType || this.getComposeOutputType(typeClass);
        if (!result) throw new TypeNotSpecified(constructor, property);
        return result;
    }

    private handleArrayType(constructor, property, providenType) {
        if (!providenType) throw new ArrayTypeNotSpecified(constructor, property);
        if (Array.isArray(providenType)) {
            return providenType;
        } else {
            return [providenType] as ComposeOutputType<any, any>;
        }
    }
}

export class PropertyTypeKeeper {

    isMethod<T>(constructor: ClassType<T>, name: StringKey<T>): boolean {
        return this.getPropertyType(constructor, name) == Function;
    }

    getPropertyType(constructor: ClassType, property: string): ClassType {
        return Reflect.getMetadata('design:type', constructor.prototype, property);
    }
}

export class GraphqlComposeTypescript {

    constructor(public readonly schemaComposer: SchemaComposer<any>,
                protected mounter: Mounter,
                protected typeComposerCreator: TypeComposerCreator,
                protected resolverBuilder: ResolverBuilder) {
    }

    mountInstances(instances: any[]): SchemaComposer<any> {
        this.mounter.mountInstances(this.schemaComposer, instances);
        return this.schemaComposer;
    }

    getComposer<T>(typeOrInstance: AnnotatedClass<T>): TypeComposer<T, DefaultContext<T>> {
        return this.typeComposerCreator.getOrCreateComposer(typeOrInstance);
    }

    getResolver<T>(instance: T, method: keyof T & string): Resolver<T> {
        return this.resolverBuilder.createResolver(instance, method);
    }

    static create() {
        const classSpecialist = new ClassSpecialist();
        const nameConvertor = new TypeNameConvertor(classSpecialist);
        const ptk = new PropertyTypeKeeper();
        const fieldSpecKeeper = new FieldSpecKeeper();
        const typeNameKeeper = new TypeNameKeeper(classSpecialist);
        const queue = new Queue();
        const typeMapper = new TypeMapper(fieldSpecKeeper, classSpecialist, typeNameKeeper, queue, ptk);
        const argumentsBuilder = new ArgumentsBuilder(typeMapper);
        const typeComposerCreator = new TypeComposerCreator(argumentsBuilder, typeMapper, fieldSpecKeeper, ptk, typeNameKeeper, schemaComposer);
        const resolverSpecStorage = new ResolverSpecStorage();
        const resolverBuilder = new ResolverBuilder(typeMapper, argumentsBuilder, new QueueSolver(queue, typeComposerCreator), resolverSpecStorage);
        const mounter = new Mounter(nameConvertor, resolverBuilder);
        return new GraphqlComposeTypescript(schemaComposer, mounter, typeComposerCreator, resolverBuilder);
    }
}

export interface ClassType<T = any> extends Function {
    new(...args: any[]): T;
}
