import {Queue, OutputTypeQueueItem} from "./queue";
import {InputTypeComposer, TypeComposer} from "graphql-compose";
import {ComposerBuilder} from "./composer-builder";

export class QueueSolver {
    constructor(protected queue: Queue,
                protected outputBuilder: ComposerBuilder<TypeComposer>,
                protected inputBuilder: ComposerBuilder<InputTypeComposer>) {
    }

    solve() {
        for (const item of this.queue.iterateUnsolved()) {
            if (item instanceof OutputTypeQueueItem){
                this.outputBuilder.build(item.classType, item.composer);
                this.queue.markSolved(item.classType);
            } else {
                this.inputBuilder.build(item.classType, item.composer);
                this.queue.markInputSolved(item.classType);
            }
        }
    }

}
