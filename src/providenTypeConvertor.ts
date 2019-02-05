import {ComposeInputType, ComposeOutputType, InputTypeComposer, SchemaComposer, TypeComposer} from "graphql-compose";
import {ClassSpecialist, ClassType, ProvidenType} from "./graphq-compose-typescript";
import {FieldSpecKeeper} from "./field-spec";
import {Queue} from "./class-type/queue";

export class ProvidenTypeConvertor {

    constructor(protected fieldSpec: FieldSpecKeeper,
                protected classSpec: ClassSpecialist,
                protected resolutionQueue: Queue,
                protected schemaComposer: SchemaComposer<any>) {
    }

    mapToOutputType(type: ProvidenType): ComposeOutputType<any, any> {
        if (!type) return null;
        if (this.classSpec.isClassType(type)) {
            return this.getClassTypeComposer(type);
        } else if (this.classSpec.isArrayClassType(type)) {
            return [this.getClassTypeComposer(type[0]) as any]
        } else {
            return type;
        }
    }

    mapToInputType(type: ProvidenType): ComposeInputType {
        if (!type) return null;
        if (this.classSpec.isClassType(type)) {
            return this.getClassInputTypeComposer(type);
        } else if (this.classSpec.isArrayClassType(type)) {
            return [this.getClassInputTypeComposer(type[0])]
        } else {
            return type as any; //TODO: problem
        }
    }

    private getClassInputTypeComposer(typeClass: ClassType): InputTypeComposer {
        if (!typeClass) return null;
        if (typeClass === Number) {
            return this.schemaComposer.InputTypeComposer.create('Float');
        } else if (this.fieldSpec.isDecorated(typeClass)) {
            return this.resolutionQueue.addInput(typeClass);
        } else {
            return this.schemaComposer.InputTypeComposer.create(typeClass.name);
        }
    }

    private getClassTypeComposer(typeClass: ClassType): TypeComposer {
        if (!typeClass) return null;
        if (typeClass === Number) {
            return this.schemaComposer.TypeComposer.create('Float');
        } else if (this.fieldSpec.isDecorated(typeClass)) {
            return this.resolutionQueue.add(typeClass);
        } else {
            return this.schemaComposer.TypeComposer.create(typeClass.name);
        }
    }
}
