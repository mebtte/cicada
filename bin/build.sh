#!/usr/bin/env bash
set -e

npm i

npm run build:pwa
npm run build:server

mkdir build
cp -R apps/server/build/* build
mkdir build/pwa
cp -R apps/pwa/build/* build/pwa
