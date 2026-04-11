#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-release}"

cd "$ROOT_DIR"

npm ci --prefix apps/pwa
npm run build --prefix apps/pwa

rm -rf dist/pwa pwa
rm -rf apps/cli/pwa/dist
cp -R apps/pwa/dist apps/cli/pwa/dist

rm -rf build
mkdir -p build

build_cli() {
  local goos="$1"
  local goarch="$2"
  local output="$3"

  (
    cd "$ROOT_DIR/apps/cli"
    GOOS="$goos" GOARCH="$goarch" CGO_ENABLED=0 go build -tags prod -o "$ROOT_DIR/$output" .
  )
}

if [[ "$TARGET" == "docker" ]]; then
  build_cli linux amd64 build/cicada
  echo 'skip compression on docker building.'
  exit 0
fi

tag="$(git describe --abbrev=0 --tags)"

build_cli darwin amd64 build/cicada-darwin-amd64
build_cli windows amd64 build/cicada-windows-amd64.exe
build_cli linux amd64 build/cicada-linux-amd64

tar -zcvf "build/cicada-darwin-x64-$tag.tar.gz" -C build cicada-darwin-amd64
tar -zcvf "build/cicada-windows-x64-$tag.tar.gz" -C build cicada-windows-amd64.exe
tar -zcvf "build/cicada-linux-x64-$tag.tar.gz" -C build cicada-linux-amd64

rm build/cicada-darwin-amd64 build/cicada-windows-amd64.exe build/cicada-linux-amd64
