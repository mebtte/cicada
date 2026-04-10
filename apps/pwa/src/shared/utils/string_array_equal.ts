function stringArrayEqual(a: string[], b: string[]) {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0, { length } = a; i < length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

export default stringArrayEqual;
