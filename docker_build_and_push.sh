#!/usr/bin/env bash
set -e

npm run build -- docker
docker buildx build -t mebtte/cicada:${1:-latest} -f Dockerfile --platform=linux/amd64 --push .
