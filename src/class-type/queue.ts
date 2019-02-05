import {ClassType} from "../graphq-compose-typescript";


export class Queue {
    protected queue: Map<ClassType, boolean> = new Map();

    add(type: ClassType) {
        if (!this.queue.has(type)) this.queue.set(type, false);
    }

    markSolved(type: ClassType) {
        this.queue.set(type, true);
    }

    * iterateUnsolved(): IterableIterator<ClassType> {
        for (const [type, solved] of this.queue) {
            if (!solved) yield type;
        }
        if (this.hasUnresolved()) {
            yield* this.iterateUnsolved();
        }
    }

    protected hasUnresolved() {
        for (let resolved of this.queue.values()) {
            if (!resolved) return true
        }
        return false;
    }
}
