import {ClassType} from "../graphq-compose-typescript";
import {InputTypeComposer, SchemaComposer, TypeComposer} from "graphql-compose";
import {TypeNameKeeper} from "../type-name";


export interface QueueItem<C extends TypeComposer | InputTypeComposer> {
    composer: C;
    kind: 'output' | 'input';
    solved: boolean;
    constructor: ClassType
}

export class Queue {
    constructor(protected schemaComposer: SchemaComposer<any>,
                protected typeNameKeeper: TypeNameKeeper) {

    }

    protected queue: Map<ClassType, QueueItem<TypeComposer>> = new Map();
    protected inputQueue: Map<ClassType, QueueItem<InputTypeComposer>> = new Map();

    private createTypeComposer(type: ClassType) {
        let name = this.typeNameKeeper.getTypeName(type);
        return this.schemaComposer.TypeComposer.create({
            name
        })
    }

    private createInputTypeComposer(type: ClassType) {
        let name = this.typeNameKeeper.getInputTypeName(type);
        return this.schemaComposer.InputTypeComposer.create({
            name,
            fields: {}
        });
    }

    add(type: ClassType): TypeComposer {
        if (this.queue.has(type)) {
            return this.queue.get(type).composer;
        } else {
            let composer = this.createTypeComposer(type);
            this.queue.set(type, {
                solved: false,
                composer,
                kind: 'output',
                constructor: type
            });
            return composer;
        }
    }

    addInput(type: ClassType): InputTypeComposer {
        if (this.inputQueue.has(type)) {
            return this.inputQueue.get(type).composer;
        } else {
            let composer = this.createInputTypeComposer(type);
            this.inputQueue.set(type, {
                solved: false,
                composer,
                kind: 'input',
                constructor: type
            });
            return composer;
        }
    }

    markSolved(type: ClassType) {
        this.queue.get(type).solved = true;
    }

    markInputSolved(type: ClassType) {
        this.inputQueue.get(type).solved = true;
    }

    * iterateUnsolved(): IterableIterator<QueueItem<any>> {
        for (const [, item] of this.queue) {
            if (!item.solved) yield item;
        }
        for (const [, item] of this.inputQueue) {
            if (!item.solved) yield item;
        }
        if (this.hasUnresolved()) {
            yield* this.iterateUnsolved();
        }
    }

    protected hasUnresolved() {
        for (let item of this.queue.values()) {
            if (!item.solved) return true
        }

        for (let item of this.inputQueue.values()) {
            if (!item.solved) return true
        }
        return false;
    }
}
