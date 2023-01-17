#!/usr/bin/env bash
set -e

npm run build -- docker
docker buildx build -t mebtte/cicada -f Dockerfile --platform=linux/amd64 --push .
