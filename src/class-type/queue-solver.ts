import {TypeComposerCreator} from "../object-type-composition";
import {Queue} from "./queue";

export class QueueSolver {
    constructor(protected queue: Queue,
                protected creator: TypeComposerCreator) {
    }

    solve() {
        for (const item of this.queue.iterateUnsolved()) {
            if (item.kind == "output") {
                this.creator.buildTypeComposer(item.constructor, item.composer);
                this.queue.markSolved(item.constructor);
            } else {
                this.creator.buildInputTypeComposer(item.constructor, item.composer);
                this.queue.markInputSolved(item.constructor);
            }
        }
    }

}
