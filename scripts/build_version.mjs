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

export function getLatestTag() {
  return (
    runGit([
      'for-each-ref',
      '--sort=-creatordate',
      '--count=1',
      '--format=%(refname:short)',
      'refs/tags',
    ]) || 'unknown'
  );
}

export function formatVersionTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
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
    return overriddenVersion;
  }

  const latestTag = options.latestTag || getLatestTag();
  const buildProfile = options.buildProfile || resolveBuildProfile(options);

  if (buildProfile === 'development') {
    return `${latestTag}-local`;
  }

  if (buildProfile === 'beta') {
    return `${latestTag}-beta.${formatVersionTimestamp(options.now ?? new Date())}`;
  }

  return latestTag;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  const mode = process.argv[2];

  if (mode === 'latest-tag') {
    process.stdout.write(`${getLatestTag()}\n`);
  } else {
    process.stdout.write(`${resolveVersion()}\n`);
  }
}
