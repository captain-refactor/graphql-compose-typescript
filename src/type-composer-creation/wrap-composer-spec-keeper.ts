import { ClassType } from "../graphq-compose-typescript";
import { List } from "immutable";
import { InputTypeComposer, ObjectTypeComposer } from "graphql-compose";

const WRAPPERS = Symbol.for("wrappers");
export type TCWrapper = (
  otc: ObjectTypeComposer | InputTypeComposer
) => ObjectTypeComposer | InputTypeComposer;

export class WrapComposerSpecKeeper {
  addWrapper(constructor: ClassType, fn: TCWrapper) {
    let list = constructor[WRAPPERS] || List<TCWrapper>();
    constructor[WRAPPERS] = list.push(fn);
  }
  getWrappers(constructor: ClassType): IterableIterator<TCWrapper> {
    return constructor[WRAPPERS] || [];
  }
}
