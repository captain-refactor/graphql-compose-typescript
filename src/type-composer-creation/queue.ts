import {ClassType} from "../graphq-compose-typescript";
import {InputTypeComposer, TypeComposer} from "graphql-compose";
import {ComposerInstanceCreator} from "./composer-creator";

class QueueItem<C extends TypeComposer | InputTypeComposer> {
    solved: boolean = false;
    constructor(public classType: ClassType, public composer: C) {
    }
}

export class InputTypeQueueItem extends QueueItem<InputTypeComposer> {
}

export class OutputTypeQueueItem extends  QueueItem<TypeComposer> {
}

export function createOutputQueueItem(classType: ClassType, composer: TypeComposer) {
    return new OutputTypeQueueItem(classType, composer);
}

export function createInputQueueItem(classType: ClassType, composer: InputTypeComposer) {
    return new InputTypeQueueItem(classType, composer);

}

export interface CreateQueueItem<C extends TypeComposer | InputTypeComposer> {
    (constructor: ClassType, composer: C): QueueItem<C>
}

export class BaseQueue<C extends TypeComposer | InputTypeComposer> {
    constructor(protected instanceCreator: ComposerInstanceCreator<C>,
                protected createQueueItem: CreateQueueItem<C>) {
    }

    protected queue: Map<ClassType, QueueItem<C>> = new Map();

    add(type: ClassType): C {
        if (this.queue.has(type)) {
            return this.queue.get(type).composer;
        } else {
            let composer = this.instanceCreator.create(type);
            this.queue.set(type, this.createQueueItem(type, composer));
            return composer;
        }
    }

    markSolved(type: ClassType) {
        this.queue.get(type).solved = true;
    }

    hasUnresolved() {
        for (let item of this.queue.values()) {
            if (!item.solved) return true
        }
        return false;
    }

    * iterateUnsolved(): IterableIterator<QueueItem<any>> {
        for (const [, item] of this.queue) {
            if (!item.solved) yield item;
        }
    }
}

export class Queue {
    constructor(protected input: BaseQueue<InputTypeComposer>,
                protected output: BaseQueue<TypeComposer>) {
    }

    markSolved(type: ClassType) {
        this.output.markSolved(type);
    }

    markInputSolved(type: ClassType) {
        this.input.markSolved(type);
    }

    * iterateUnsolved(): IterableIterator<QueueItem<any>> {
        yield* this.output.iterateUnsolved();
        yield* this.input.iterateUnsolved();
        if (this.hasUnresolved()) {
            yield* this.iterateUnsolved();
        }
    }

    protected hasUnresolved() {
        return this.input.hasUnresolved() || this.output.hasUnresolved();
    }
}
