#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$ROOT_DIR/build.sh" docker
docker buildx build -t mebtte/cicada:$1 -f "$ROOT_DIR/docker/Dockerfile" --platform=linux/amd64 --push "$ROOT_DIR"
