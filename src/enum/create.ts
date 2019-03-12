import { EnumTypeComposer } from "graphql-compose";
import { GraphQLEnumValueConfigMap } from "graphql";

export function createEnum(name: string, enumObj) {
  let used = new Set<string | number>();
  const objKeys = Object.keys(enumObj);
  let configMap: GraphQLEnumValueConfigMap = {};
  for (let value of objKeys) {
    let key = enumObj[value];
    if (used.has(value) || used.has(key)) break;
    used.add(key);
    used.add(value);
    configMap[key] = {
      value
    };
  }
  return EnumTypeComposer.create({ name, values: configMap });
}
