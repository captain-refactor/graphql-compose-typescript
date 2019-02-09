import {ComposeInputType, ComposeOutputType, InputTypeComposer, SchemaComposer, TypeComposer} from "graphql-compose";
import {ClassSpecialist, ClassType, ProvidenInputType, ProvidenOutputType} from "./graphq-compose-typescript";
import {FieldSpecKeeper} from "./field-spec";
import {Queue} from "./class-type/queue";

export class ProvidenTypeConvertor {

    constructor(protected fieldSpec: FieldSpecKeeper,
                protected classSpec: ClassSpecialist,
                protected resolutionQueue: Queue,
                protected schemaComposer: SchemaComposer<any>) {
    }

    mapToOutputType(type: ProvidenOutputType): ComposeOutputType<any, any> {
        if (!type) return null;
        if (this.classSpec.isClassType(type)) {
            return this.getClassComposeType(type);
        } else if (this.classSpec.isArrayClassType(type)) {
            return [this.getClassComposeType(type[0])]
        } else {
            return type;
        }
    }

    mapToInputType(type: ProvidenInputType): ComposeInputType {
        if (!type) return null;
        if (this.classSpec.isClassType(type)) {
            return this.getClassInputComposeType(type);
        } else if (this.classSpec.isArrayClassType(type)) {
            return [this.getClassInputComposeType(type[0])]
        } else {
            return type as any; //TODO: problem
        }
    }

    private getClassInputComposeType(typeClass: ClassType): InputTypeComposer | string {
        if (!typeClass) return null;
        if (typeClass === String) {
            return 'String';
        } else if (typeClass === Number) {
            return 'Float';
        } else if(typeClass === Date){
            return 'Date';
        } else if (this.fieldSpec.isDecorated(typeClass)) {
            return this.resolutionQueue.addInput(typeClass);
        } else {
            return this.schemaComposer.InputTypeComposer.create(typeClass.name);
        }
    }

    private getClassComposeType(typeClass: ClassType): TypeComposer | string {
        if (!typeClass) return null;
        if (typeClass === String) {
            return 'String';
        } else if(typeClass === Date){
            return 'Date';
        } else if (typeClass === Number) {
            return 'Float';
        } else if (this.fieldSpec.isDecorated(typeClass)) {
            return this.resolutionQueue.add(typeClass);
        } else {
            return this.schemaComposer.TypeComposer.create(typeClass.name);
        }
    }
}
