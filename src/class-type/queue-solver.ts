import {TypeComposerCreator} from "../object-type-composition";
import {Queue} from "./queue";

export class QueueSolver {
    constructor(protected queue: Queue,
                protected creator: TypeComposerCreator) {
    }

    solve() {
        for (const classType of this.queue.iterateUnsolved()) {
            this.creator.createTypeComposer(classType);
        }
    }

}
