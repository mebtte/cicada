#!/usr/bin/env bash
set -e

./build.sh docker
docker buildx build -t mebtte/cicada:$1 -f Dockerfile --platform=linux/amd64 --push .
