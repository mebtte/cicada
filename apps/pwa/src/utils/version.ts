export function getMajorVersion(version: string) {
  const match = version.trim().match(/^v?(\d+)(?:[.+-]|$)/);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

export function isSameMajorVersion(a: string, b: string) {
  const aMajor = getMajorVersion(a);
  const bMajor = getMajorVersion(b);

  if (aMajor === null || bMajor === null) {
    return true;
  }
  return aMajor === bMajor;
}
