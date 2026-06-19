import cp from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function runGit(args) {
  try {
    return cp.execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

const BASE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const VERSION_DESCRIPTION_PATTERN = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*$/;
const APP_VERSION_PATTERN =
  /^\d+\.\d+\.\d+(?:-[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*)?$/;

export function isBaseVersion(version) {
  return BASE_VERSION_PATTERN.test(version.trim());
}

export function isAppVersion(version) {
  return APP_VERSION_PATTERN.test(version.trim());
}

export function assertBaseVersion(version, label = 'version') {
  if (!isBaseVersion(version)) {
    throw new Error(
      `${label} must match MAJOR.MINOR.PATCH, received ${JSON.stringify(
        version,
      )}`,
    );
  }
}

export function assertAppVersion(version, label = 'version') {
  if (!isAppVersion(version)) {
    throw new Error(
      `${label} must match MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-description, received ${JSON.stringify(
        version,
      )}`,
    );
  }
}

export function getBaseVersion(version) {
  const trimmed = version.trim();
  const suffixIndex = trimmed.indexOf('-');

  if (suffixIndex === -1) {
    return trimmed;
  }
  return trimmed.slice(0, suffixIndex);
}

export function appendVersionDescription(version, description) {
  const baseVersion = getBaseVersion(version);
  const trimmedDescription = description.trim();
  assertBaseVersion(baseVersion, 'base version');

  if (!trimmedDescription) {
    return baseVersion;
  }
  if (!VERSION_DESCRIPTION_PATTERN.test(trimmedDescription)) {
    throw new Error(
      `version description must use dot-separated alphanumeric parts, received ${JSON.stringify(
        description,
      )}`,
    );
  }
  return `${baseVersion}-${trimmedDescription}`;
}

export function getLatestTag() {
  const tags = runGit([
    'for-each-ref',
    '--sort=-creatordate',
    '--format=%(refname:short)',
    'refs/tags',
  ])
    .split('\n')
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.find(isBaseVersion) || '';
}

export function formatVersionTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');

  return [
    String(date.getFullYear()).slice(-2),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('');
}

export function resolveBuildProfile({
  command,
  buildProfile = process.env.CICADA_BUILD_PROFILE?.trim(),
} = {}) {
  if (buildProfile === 'development' || command === 'serve') {
    return 'development';
  }

  if (buildProfile === 'beta') {
    return 'beta';
  }

  return 'production';
}

export function resolveVersion(options = {}) {
  const overriddenVersion = process.env.CICADA_VERSION?.trim();
  if (overriddenVersion) {
    assertAppVersion(overriddenVersion, 'CICADA_VERSION');
    return overriddenVersion;
  }

  const latestTag = options.latestTag ?? getLatestTag();
  assertBaseVersion(latestTag, 'latest Git tag');
  const buildProfile = options.buildProfile || resolveBuildProfile(options);

  if (buildProfile === 'development') {
    return appendVersionDescription(latestTag, 'local');
  }

  if (buildProfile === 'beta') {
    return appendVersionDescription(
      latestTag,
      `beta.${formatVersionTimestamp(options.now ?? new Date())}`,
    );
  }

  return getBaseVersion(latestTag);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  const mode = process.argv[2];

  try {
    if (mode === 'latest-tag') {
      const latestTag = getLatestTag();
      assertBaseVersion(latestTag, 'latest Git tag');
      process.stdout.write(`${latestTag}\n`);
    } else if (mode === 'validate') {
      assertAppVersion(process.argv[3] ?? '', 'version');
    } else {
      process.stdout.write(`${resolveVersion()}\n`);
    }
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : err}\n`);
    process.exit(1);
  }
}
