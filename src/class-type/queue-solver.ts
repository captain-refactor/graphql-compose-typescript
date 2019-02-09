import {Queue} from "./queue";
import {InputTypeComposer, TypeComposer} from "graphql-compose";
import {ComposerBuilder} from "../type-composer-creation/composer-builder";

export class QueueSolver {
    constructor(protected queue: Queue,
                protected outputBuilder: ComposerBuilder<TypeComposer>,
                protected inputBuilder: ComposerBuilder<InputTypeComposer>) {
    }

    solve() {
        for (const item of this.queue.iterateUnsolved()) {
            if (item.kind == "output") {
                this.outputBuilder.build(item.constructor, item.composer);
                this.queue.markSolved(item.constructor);
            } else {
                this.inputBuilder.build(item.constructor, item.composer);
                this.queue.markInputSolved(item.constructor);
            }
        }
    }

}
