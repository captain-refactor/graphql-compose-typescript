import {
    ClassSpecialist,
    ClassType,
    ProvidenType
} from "./graphq-compose-typescript";
import {FieldSpecKeeper} from "./field-spec";
import {BaseQueue} from "./type-composer-creation/queue";
import {ComposerInstanceCreator} from "./type-composer-creation/composer-creator";
import {IOComposers} from "./utils";
import {ComposeInputType, ComposeOutputType} from "graphql-compose";

export type ComposeType = ComposeInputType | ComposeOutputType<any, any>;
export type ComposerIn<T extends ComposeType> = Extract<IOComposers, T>

export class ProvidenTypeConvertor<T extends ComposeType, C extends ComposerIn<T> = ComposerIn<T>> {

    constructor(protected classSpec: ClassSpecialist,
                protected fieldSpec: FieldSpecKeeper,
                protected queue: BaseQueue<C>,
                protected creator: ComposerInstanceCreator<C>) {
    }

    toComposeType(type: ProvidenType): T {
        if (!type) return null;
        if (this.classSpec.isClassType(type)) {
            return this.classToComposeType(type);
        } else if (this.classSpec.isArrayClassType(type)) {
            return [this.classToComposeType(type[0])] as any
        } else {
            return type as any;
        }
    }

    classToComposeType(typeClass: ClassType): T {
        if (!typeClass) return null;
        if (typeClass === String) {
            return 'String' as any;
        } else if (typeClass === Date) {
            return 'Date' as any;
        } else if (typeClass === Number) {
            return 'Float' as any;
        } else if (this.fieldSpec.isDecorated(typeClass)) {
            return this.queue.add(typeClass);
        } else {
            return this.creator.createFromString(typeClass.name);
        }
    }
}
