import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG_DIR = path.join(ROOT_DIR, 'apps', 'cli', 'internal', 'ffmpeg');
const GENERATED_DIR = path.join(FFMPEG_DIR, 'generated');
const PREPARE_SCRIPT = path.join(ROOT_DIR, 'scripts', 'prepare_ffmpeg_bundle.mjs');

const TARGETS = {
  'darwin-amd64': { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe' },
  'darwin-arm64': { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe' },
  'linux-amd64': { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe' },
  'linux-arm64': { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe' },
  'windows-amd64': { ffmpeg: 'ffmpeg.exe', ffprobe: 'ffprobe.exe' },
  'windows-arm64': { ffmpeg: 'ffmpeg.exe', ffprobe: 'ffprobe.exe' },
};

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function currentTarget() {
  const platformMap = {
    darwin: 'darwin',
    linux: 'linux',
    win32: 'windows',
  };
  const archMap = {
    x64: 'amd64',
    arm64: 'arm64',
  };

  const goos = platformMap[process.platform];
  const goarch = archMap[process.arch];
  if (!goos || !goarch) {
    fail(`unsupported host platform: ${process.platform}/${process.arch}`);
  }

  return `${goos}-${goarch}`;
}

function bundleFiles(target) {
  const targetInfo = TARGETS[target];
  if (!targetInfo) {
    fail(`unsupported target: ${target}`);
  }

  return {
    ffmpeg: path.join(GENERATED_DIR, target, targetInfo.ffmpeg),
    ffprobe: path.join(GENERATED_DIR, target, targetInfo.ffprobe),
    bundleGo: path.join(FFMPEG_DIR, `zz_bundle_${target}.go`),
  };
}

function hasBundle(target) {
  const files = bundleFiles(target);
  return fs.existsSync(files.ffmpeg) && fs.existsSync(files.ffprobe) && fs.existsSync(files.bundleGo);
}

function main() {
  const target = currentTarget();
  if (hasBundle(target)) {
    process.stdout.write(`ffmpeg bundle ready for ${target}\n`);
    return;
  }

  execFileSync('node', [PREPARE_SCRIPT, '--target', target], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
}

main();
