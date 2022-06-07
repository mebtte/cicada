function excludeProperty<
  Obj extends {
    [key: string]: unknown;
  },
  Property extends keyof Obj,
>(obj: Obj, excludeProperties: Property[]) {
  const properties = Object.keys(obj);
  const newObj: { [key: string]: unknown } = {};
  for (const property of properties) {
    if (excludeProperties.includes(property as Property)) {
      continue;
    }
    newObj[property] = obj[property];
  }
  return newObj as {
    [key in Exclude<keyof Obj, typeof excludeProperties[number]>]: Obj[key];
  };
}

export default excludeProperty;
