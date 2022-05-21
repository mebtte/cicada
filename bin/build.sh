#!/usr/bin/env bash
set -e

if [ -d build ]; then
  rm -rf build/*
else
  mkdir build
fi

npm install --verbose

# pwa
npm run build:pwa
mkdir build/pwa
cp -R apps/pwa/build/* build/pwa

# server
npm run build:server
cp -R apps/server/build/* build
