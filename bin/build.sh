#!/usr/bin/env bash
set -e

if [ -d build ]; then
  rm -rf build/*
else
  mkdir build
fi

npm i

npm run build:pwa
npm run build:server

cp -R apps/server/build/* build
mkdir build/pwa
cp -R apps/pwa/build/* build/pwa
