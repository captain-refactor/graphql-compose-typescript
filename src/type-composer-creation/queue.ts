import {ProvidenType} from "../graphq-compose-typescript";
import {EnumTypeComposer, InputTypeComposer, Resolver, TypeComposer} from "graphql-compose";
import {ComposerInstanceCreator} from "./composer-creator";
import {
    GraphQLEnumType,
    GraphQLInterfaceType,
    GraphQLList,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLUnionType
} from "graphql";

class QueueItem<C extends TypeComposer | InputTypeComposer> {
    solved: boolean = false;

    constructor(public classType: ProvidenTypeSingular, public composer: C) {
    }
}

export class InputTypeQueueItem extends QueueItem<InputTypeComposer> {
    static create(classType: ProvidenTypeSingular, composer: InputTypeComposer) {
        return new InputTypeQueueItem(classType, composer);
    }
}

export class OutputTypeQueueItem extends QueueItem<TypeComposer> {
    static create(classType: ProvidenTypeSingular, composer: TypeComposer) {
        return new OutputTypeQueueItem(classType, composer);
    }
}

export interface QueueItemFactory<C extends TypeComposer | InputTypeComposer> {
    create(constructor: ProvidenTypeSingular, composer: C): QueueItem<C>
}

export type ProvidenTypeSingular = Exclude<ProvidenType, Array<any> | EnumTypeComposer | GraphQLList<any> | GraphQLScalarType | GraphQLEnumType | GraphQLObjectType | GraphQLInterfaceType | GraphQLUnionType | Resolver>

export class BaseQueue<C extends TypeComposer | InputTypeComposer> {
    constructor(protected instanceCreator: ComposerInstanceCreator<C>,
                protected queueItemFactory: QueueItemFactory<C>) {
    }

    protected queue: Map<ProvidenTypeSingular, QueueItem<C>> = new Map();

    add(type: ProvidenTypeSingular): C {
        if (this.queue.has(type)) {
            return this.queue.get(type).composer;
        } else {
            let composer = this.instanceCreator.create(type);
            this.queue.set(type, this.queueItemFactory.create(type, composer));
            return composer;
        }
    }

    has(type: ProvidenTypeSingular): boolean {
        return this.queue.has(type);
    }

    markSolved(type: ProvidenTypeSingular) {
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

    markSolved(type: ProvidenTypeSingular) {
        this.output.markSolved(type);
    }

    markInputSolved(type: ProvidenTypeSingular) {
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
