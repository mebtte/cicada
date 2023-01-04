#!/usr/bin/env bash
set -e

npm run build -- no-compress
docker buildx build -t mebtte/cicada -f Dockerfile --platform=linux/amd64 --push .
# docker buildx build -t mebtte/cicada -f Dockerfile.arm64 --platform=linux/arm64 --push .
