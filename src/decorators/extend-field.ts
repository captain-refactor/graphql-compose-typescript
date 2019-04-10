import { ComposeFieldConfig } from "graphql-compose";
import { $wrapTC } from "./wrap-otc";
import { getConstructor } from "../utils";

export function $extendField(
  options: Partial<ComposeFieldConfig<any, any>>
) {
  return (target, propertyKey) => {
    // @ts-ignore
    $wrapTC(otc => otc.extendField(propertyKey, options))(
      getConstructor(target)
    );
  };
}
