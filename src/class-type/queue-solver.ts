import {TypeComposerCreator} from "../object-type-composition";
import {Queue} from "./queue";

export class QueueSolver {
    constructor(protected queue: Queue,
                protected creator: TypeComposerCreator) {
    }

    solve() {
        for (const item of this.queue.iterateUnsolved()) {
            this.creator.buildTypeComposer(item.type, item.composer);
            this.queue.markSolved(item.type);
        }
        for (const item of this.queue.iterateUnsolvedInput()) {
            this.creator.buildInputTypeComposer(item.type, item.composer);
            this.queue.markInputSolved(item.type);
        }
    }

}
