function excludeProperties<
  Obj extends Record<string, unknown>,
  Property extends keyof Obj,
>(obj: Obj, excludeProperties: Property[]) {
  const properties = Object.keys(obj);
  const newObj: Record<string, unknown> = {};
  for (const property of properties) {
    if (excludeProperties.includes(property as Property)) {
      continue;
    }
    newObj[property] = obj[property];
  }
  return newObj as {
    [key in Exclude<keyof Obj, (typeof excludeProperties)[number]>]: Obj[key];
  };
}

export default excludeProperties;
