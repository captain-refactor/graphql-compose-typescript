import { EnumTypeComposer, schemaComposer } from "graphql-compose";
import { GraphQLEnumValueConfigMap } from "graphql";

function createConfigMapFromEnumObj(enumObj) {
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
  return configMap;
}

function createFromArray(values: string[]) {
  let result = {};
  for (let value of values) {
    result[value] = { value };
  }
  return result;
}

export function createEnum(name: string, enumObj: string[] | object) {
  let configMap;
  if (Array.isArray(enumObj)) {
    configMap = createFromArray(enumObj);
  } else {
    configMap = createConfigMapFromEnumObj(enumObj);
  }
  return EnumTypeComposer.createTemp({ name, values: configMap });
}
