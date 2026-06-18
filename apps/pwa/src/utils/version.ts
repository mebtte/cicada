export function getBaseVersion(version: string) {
  const trimmed = version.trim();
  const suffixIndex = trimmed.indexOf('-');

  if (suffixIndex === -1) {
    return trimmed;
  }
  return trimmed.slice(0, suffixIndex);
}

export function getMajorVersion(version: string) {
  const match = getBaseVersion(version).match(/^v?(\d+)(?:[.+]|$)/);
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
