import { InterfaceTypeComposer, ObjectTypeComposer } from "graphql-compose";
import { $wrapTC } from "./wrap-otc";

export function $implements(iface: InterfaceTypeComposer) {
  return $wrapTC(otc => (otc as ObjectTypeComposer).addInterface(iface));
}
