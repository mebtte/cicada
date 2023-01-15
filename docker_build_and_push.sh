#!/usr/bin/env bash
set -e

npm run build -- docker
docker buildx build -t mebtte/amd64-cicada -f Dockerfile --platform=linux/amd64 --push .
