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

export function getSemanticVersion(version: string) {
  const match = getBaseVersion(version).match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function compareSemanticVersion(a: string, b: string) {
  const aVersion = getSemanticVersion(a);
  const bVersion = getSemanticVersion(b);

  if (!aVersion || !bVersion) {
    return null;
  }

  for (const key of ['major', 'minor', 'patch'] as const) {
    if (aVersion[key] > bVersion[key]) {
      return 1;
    }
    if (aVersion[key] < bVersion[key]) {
      return -1;
    }
  }

  return 0;
}

export function isSameMajorVersion(a: string, b: string) {
  const aMajor = getMajorVersion(a);
  const bMajor = getMajorVersion(b);

  if (aMajor === null || bMajor === null) {
    return true;
  }
  return aMajor === bMajor;
}

export function isServerVersionSupported(
  pwaVersion: string,
  serverVersion: string,
) {
  const pwa = getSemanticVersion(pwaVersion);
  const server = getSemanticVersion(serverVersion);

  if (!pwa || !server || pwa.major !== server.major) {
    return false;
  }
  return compareSemanticVersion(serverVersion, pwaVersion) === 1;
}
