#!/usr/bin/env bash
set -e

# npm run build -- no-compress
# docker build -t mebtte/cicada - <Dockerfile
docker build -t mebtte/cicada - <Dockerfile.arm64
