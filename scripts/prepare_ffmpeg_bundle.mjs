import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_DIR = path.join(ROOT_DIR, 'apps', 'cli', 'internal', 'ffmpeg');
const GENERATED_DIR = path.join(TARGET_DIR, 'generated');
const OSX_EXPERTS_URL = 'https://www.osxexperts.net/';
const BTBN_RELEASE_BASE = 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/';
const BTBN_RELEASE_FALLBACK_BASES = [
  BTBN_RELEASE_BASE,
  'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/',
];

const TARGETS = {
  'darwin-arm64': {
    goos: 'darwin',
    goarch: 'arm64',
    ffmpeg: 'ffmpeg',
    ffprobe: 'ffprobe',
    provider: 'osxexperts',
  },
  'linux-amd64': {
    goos: 'linux',
    goarch: 'amd64',
    ffmpeg: 'ffmpeg',
    ffprobe: 'ffprobe',
    provider: 'btbn',
    archiveName: 'ffmpeg-master-latest-linux64-gpl.tar.xz',
  },
  'linux-arm64': {
    goos: 'linux',
    goarch: 'arm64',
    ffmpeg: 'ffmpeg',
    ffprobe: 'ffprobe',
    provider: 'btbn',
    archiveName: 'ffmpeg-master-latest-linuxarm64-gpl.tar.xz',
  },
  'windows-amd64': {
    goos: 'windows',
    goarch: 'amd64',
    ffmpeg: 'ffmpeg.exe',
    ffprobe: 'ffprobe.exe',
    provider: 'btbn',
    archiveName: 'ffmpeg-master-latest-win64-gpl.zip',
  },
  'windows-arm64': {
    goos: 'windows',
    goarch: 'arm64',
    ffmpeg: 'ffmpeg.exe',
    ffprobe: 'ffprobe.exe',
    provider: 'btbn',
    archiveName: 'ffmpeg-master-latest-winarm64-gpl.zip',
  },
};

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      throw new Error(`unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`missing value for --${key}`);
    }
    options[key] = value;
    i += 1;
  }
  return options;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function isURL(value) {
  return /^https?:\/\//i.test(value);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function sha256(filePath) {
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`request failed for ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function downloadToFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`download failed for ${url}: ${response.status} ${response.statusText}`);
  }

  const data = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, data);
}

function extractArchive(archivePath, destination) {
  ensureDir(destination);
  const lower = archivePath.toLowerCase();
  if (lower.endsWith('.zip')) {
    execFileSync('unzip', ['-q', archivePath, '-d', destination], { stdio: 'inherit' });
    return;
  }
  if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
    execFileSync('tar', ['-xzf', archivePath, '-C', destination], { stdio: 'inherit' });
    return;
  }
  if (lower.endsWith('.tar.xz') || lower.endsWith('.txz')) {
    execFileSync('tar', ['-xJf', archivePath, '-C', destination], { stdio: 'inherit' });
    return;
  }
  throw new Error(`unsupported archive format: ${archivePath}`);
}

function isArchive(filePath) {
  const lower = filePath.toLowerCase();
  return (
    lower.endsWith('.zip') ||
    lower.endsWith('.tar.gz') ||
    lower.endsWith('.tgz') ||
    lower.endsWith('.tar.xz') ||
    lower.endsWith('.txz')
  );
}

function walk(dir) {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walk(fullPath));
      continue;
    }
    output.push(fullPath);
  }
  return output;
}

function findBinary(rootDir, name) {
  const matches = walk(rootDir).filter((file) => path.basename(file).toLowerCase() === name.toLowerCase());
  if (matches.length === 0) {
    throw new Error(`cannot find ${name} in extracted archive`);
  }
  if (matches.length > 1) {
    matches.sort((a, b) => a.length - b.length);
  }
  return matches[0];
}

function envArchiveKey(target) {
  return `FFMPEG_ARCHIVE_${target.toUpperCase().replace(/-/g, '_')}`;
}

function envArchiveSHAKey(target) {
  return `FFMPEG_SHA256_${target.toUpperCase().replace(/-/g, '_')}`;
}

function envFFmpegSourceKey(target) {
  return `FFMPEG_FFMPEG_SOURCE_${target.toUpperCase().replace(/-/g, '_')}`;
}

function envFFprobeSourceKey(target) {
  return `FFMPEG_FFPROBE_SOURCE_${target.toUpperCase().replace(/-/g, '_')}`;
}

function normalizeSourceInput(value, fallbackName) {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    const location = value.trim();
    return {
      location,
      fileName: deriveFileName(location, fallbackName),
    };
  }
  const location = value.location?.trim() || value.url?.trim() || value.path?.trim();
  if (!location) {
    throw new Error('source location is required');
  }
  return {
    location,
    fileName: value.fileName?.trim() || deriveFileName(location, fallbackName),
    sha256: value.sha256?.trim() || '',
    binarySha256: value.binarySha256?.trim() || '',
  };
}

function deriveFileName(location, fallbackName) {
  if (isURL(location)) {
    const pathname = new URL(location).pathname;
    const base = path.basename(pathname);
    if (base && base !== '/' && base !== '.') {
      return base;
    }
  } else {
    const base = path.basename(location);
    if (base && base !== '.' && base !== path.sep) {
      return base;
    }
  }
  if (!fallbackName) {
    throw new Error(`cannot determine filename for ${location}`);
  }
  return fallbackName;
}

async function materializeSource(source, tmpRoot, fallbackName) {
  const resolved = normalizeSourceInput(source, fallbackName);
  if (!resolved) {
    throw new Error('missing source');
  }
  const destination = path.join(tmpRoot, resolved.fileName);
  if (isURL(resolved.location)) {
    await downloadToFile(resolved.location, destination);
  } else {
    fs.copyFileSync(path.resolve(resolved.location), destination);
  }
  if (resolved.sha256) {
    const actualSHA = sha256(destination);
    if (actualSHA.toLowerCase() !== resolved.sha256.toLowerCase()) {
      throw new Error(`sha256 mismatch for ${resolved.fileName}: expected ${resolved.sha256}, got ${actualSHA}`);
    }
  }
  return destination;
}

function parseChecksumFile(content, filename) {
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length < 2) {
      continue;
    }
    const hash = parts[0];
    const name = parts[parts.length - 1].replace(/^\*/, '');
    if (name === filename) {
      return hash;
    }
  }
  return '';
}

async function fetchBtbNChecksumFile() {
  const errors = [];

  // Prefer GitHub's semantic latest-release URL, but keep BtbN's floating latest tag as a fallback.
  for (const base of BTBN_RELEASE_FALLBACK_BASES) {
    const checksumURL = new URL('checksums.sha256', base).toString();
    try {
      return {
        releaseBase: base,
        checksumFile: await fetchText(checksumURL),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${checksumURL}: ${message}`);
    }
  }

  throw new Error(`failed to fetch BtbN checksums.sha256 from known release URLs:\n${errors.join('\n')}`);
}

async function resolveBtbNSourcePlan(targetConfig) {
  const { releaseBase, checksumFile } = await fetchBtbNChecksumFile();
  const archiveName = targetConfig.archiveName;
  const checksum = parseChecksumFile(checksumFile, archiveName);
  if (!checksum) {
    throw new Error(`cannot find ${archiveName} in BtbN checksums.sha256`);
  }
  return {
    kind: 'archive',
    version: 'btbn-latest',
    archive: {
      location: new URL(archiveName, releaseBase).toString(),
      fileName: archiveName,
      sha256: checksum,
    },
  };
}

function parseOsxExpertsBinary(html, binaryName, label) {
  const anchorPattern = new RegExp(
    `<a[^>]+href="([^"]+)"[^>]*>\\s*Download\\s+${binaryName}\\s+([^<]+?)\\s*\\(${label}\\)\\s*<\\/a>`,
    'i',
  );
  const match = html.match(anchorPattern);
  if (!match || typeof match.index !== 'number') {
    throw new Error(`cannot find ${binaryName} (${label}) on ${OSX_EXPERTS_URL}`);
  }
  const window = html.slice(match.index, match.index + 800);
  const checksumMatch = window.match(/SHA256 checksum of[^:]*:\s*([a-f0-9]{64})/i);
  return {
    version: match[2].trim(),
    source: {
      location: new URL(match[1], OSX_EXPERTS_URL).toString(),
      fileName: path.basename(match[1]),
      binarySha256: checksumMatch ? checksumMatch[1] : '',
    },
  };
}

async function resolveOsxExpertsSourcePlan() {
  const html = await fetchText(OSX_EXPERTS_URL);
  const ffmpeg = parseOsxExpertsBinary(html, 'ffmpeg', 'Apple Silicon');
  const ffprobe = parseOsxExpertsBinary(html, 'ffprobe', 'Apple Silicon');
  return {
    kind: 'pair',
    version: `osxexperts-${ffmpeg.version}`,
    ffmpeg: ffmpeg.source,
    ffprobe: ffprobe.source,
  };
}

async function resolveDefaultSourcePlan(target, targetConfig) {
  switch (targetConfig.provider) {
    case 'btbn':
      return resolveBtbNSourcePlan(targetConfig);
    case 'osxexperts':
      return resolveOsxExpertsSourcePlan();
    default:
      throw new Error(`no default source provider for ${target}`);
  }
}

async function resolveSourcePlan(target, targetConfig, options) {
  const archiveOverride = options.archive?.trim() || process.env[envArchiveKey(target)]?.trim();
  if (archiveOverride) {
    return {
      kind: 'archive',
      version: options.version?.trim() || process.env.FFMPEG_VERSION?.trim() || 'custom',
      archive: {
        location: archiveOverride,
        fileName: deriveFileName(archiveOverride, `ffmpeg-${target}`),
        sha256: options.sha256?.trim() || process.env[envArchiveSHAKey(target)]?.trim() || '',
      },
    };
  }

  const ffmpegOverride = options['ffmpeg-source']?.trim() || process.env[envFFmpegSourceKey(target)]?.trim();
  const ffprobeOverride = options['ffprobe-source']?.trim() || process.env[envFFprobeSourceKey(target)]?.trim();
  if (ffmpegOverride || ffprobeOverride) {
    if (!ffmpegOverride || !ffprobeOverride) {
      throw new Error(`both ${envFFmpegSourceKey(target)} and ${envFFprobeSourceKey(target)} must be set together`);
    }
    return {
      kind: 'pair',
      version: options.version?.trim() || process.env.FFMPEG_VERSION?.trim() || 'custom',
      ffmpeg: {
        location: ffmpegOverride,
        fileName: deriveFileName(ffmpegOverride, targetConfig.ffmpeg),
      },
      ffprobe: {
        location: ffprobeOverride,
        fileName: deriveFileName(ffprobeOverride, targetConfig.ffprobe),
      },
    };
  }

  const plan = await resolveDefaultSourcePlan(target, targetConfig);
  if (options.version?.trim()) {
    plan.version = options.version.trim();
  } else if (process.env.FFMPEG_VERSION?.trim()) {
    plan.version = process.env.FFMPEG_VERSION.trim();
  }
  return plan;
}

function copyResolvedBinary(inputPath, source, binaryName, destinationDir) {
  const resolvedSource = normalizeSourceInput(source, binaryName);
  let binaryPath = inputPath;
  if (isArchive(inputPath)) {
    const extractedDir = path.join(destinationDir, `${binaryName}-extract`);
    removeDir(extractedDir);
    extractArchive(inputPath, extractedDir);
    binaryPath = findBinary(extractedDir, binaryName);
  }
  if (resolvedSource.binarySha256) {
    const actualSHA = sha256(binaryPath);
    if (actualSHA.toLowerCase() !== resolvedSource.binarySha256.toLowerCase()) {
      throw new Error(`sha256 mismatch for ${path.basename(binaryPath)}: expected ${resolvedSource.binarySha256}, got ${actualSHA}`);
    }
  }
  return binaryPath;
}

function generateGoFile(target, targetConfig, version) {
  const safeTarget = target.replace(/-/g, '_');
  return `// Code generated by scripts/prepare_ffmpeg_bundle.mjs. DO NOT EDIT.
//go:build ${targetConfig.goos} && ${targetConfig.goarch}

package ffmpeg

import _ "embed"

//go:embed generated/${target}/${targetConfig.ffmpeg}
var embeddedFFmpeg_${safeTarget} []byte

//go:embed generated/${target}/${targetConfig.ffprobe}
var embeddedFFprobe_${safeTarget} []byte

func init() {
\tregisterEmbeddedBundle(embeddedBundle{
\t\ttarget:      "${target}",
\t\tversion:     "${version}",
\t\tffmpegName:  "${targetConfig.ffmpeg}",
\t\tffprobeName: "${targetConfig.ffprobe}",
\t\tffmpegData:  embeddedFFmpeg_${safeTarget},
\t\tffprobeData: embeddedFFprobe_${safeTarget},
\t})
}
`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const target = options.target?.trim();
  if (!target) {
    fail('missing --target');
  }
  const targetConfig = TARGETS[target];
  if (!targetConfig) {
    fail(`unsupported target: ${target}`);
  }

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cicada-ffmpeg-'));

  try {
    const plan = await resolveSourcePlan(target, targetConfig, options);
    const version = plan.version || 'unknown';

    let ffmpegPath;
    let ffprobePath;
    if (plan.kind === 'archive') {
      const archivePath = await materializeSource(plan.archive, tmpRoot, plan.archive.fileName);
      const extractedDir = path.join(tmpRoot, 'archive-extracted');
      extractArchive(archivePath, extractedDir);
      ffmpegPath = findBinary(extractedDir, targetConfig.ffmpeg);
      ffprobePath = findBinary(extractedDir, targetConfig.ffprobe);
    } else {
      const ffmpegInput = await materializeSource(plan.ffmpeg, tmpRoot, targetConfig.ffmpeg);
      const ffprobeInput = await materializeSource(plan.ffprobe, tmpRoot, targetConfig.ffprobe);
      ffmpegPath = copyResolvedBinary(ffmpegInput, plan.ffmpeg, targetConfig.ffmpeg, tmpRoot);
      ffprobePath = copyResolvedBinary(ffprobeInput, plan.ffprobe, targetConfig.ffprobe, tmpRoot);
    }

    const outputDir = path.join(GENERATED_DIR, target);
    removeDir(outputDir);
    ensureDir(outputDir);

    fs.copyFileSync(ffmpegPath, path.join(outputDir, targetConfig.ffmpeg));
    fs.copyFileSync(ffprobePath, path.join(outputDir, targetConfig.ffprobe));

    if (targetConfig.goos !== 'windows') {
      fs.chmodSync(path.join(outputDir, targetConfig.ffmpeg), 0o755);
      fs.chmodSync(path.join(outputDir, targetConfig.ffprobe), 0o755);
    }

    const goFilePath = path.join(TARGET_DIR, `zz_bundle_${target}.go`);
    fs.writeFileSync(goFilePath, generateGoFile(target, targetConfig, version));

    process.stdout.write(`prepared embedded ffmpeg bundle for ${target} (${version})\n`);
  } finally {
    removeDir(tmpRoot);
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
