import { Queue, OutputTypeQueueItem } from "./queue";
import { InputTypeComposer, ObjectTypeComposer } from "graphql-compose";
import { ComposerBuilder } from "./composer-builder";
import { ClassSpecialist } from "../graphq-compose-typescript";

export class QueueSolver {
  constructor(
    protected queue: Queue,
    protected outputBuilder: ComposerBuilder<ObjectTypeComposer>,
    protected inputBuilder: ComposerBuilder<InputTypeComposer>,
    protected classSpecialist: ClassSpecialist
  ) {}

  solve() {
    for (const item of this.queue.iterateUnsolved()) {
      if (item instanceof OutputTypeQueueItem) {
        if (this.classSpecialist.isClassType(item.classType)) {
          this.outputBuilder.build(item.classType, item.composer);
        }
        this.queue.markSolved(item.classType);
      } else {
        if (this.classSpecialist.isClassType(item.classType)) {
          this.inputBuilder.build(item.classType, item.composer);
        }
        this.queue.markInputSolved(item.classType);
      }
    }
  }
}
