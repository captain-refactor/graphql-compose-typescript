import { ClassType } from "../graphq-compose-typescript";
import { TCWrapper, WrapComposerSpecKeeper } from "../type-composer-creation/wrap-composer-spec-keeper";

let keeper = new WrapComposerSpecKeeper();

export function $wrapTC(fn: TCWrapper) {
  return (constructor: ClassType) => {
    keeper.addWrapper(constructor, fn);
  };
}
