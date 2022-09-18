#!/usr/bin/env bash
set -e

npm install

# get sqlite3 version
sqlite3_pkg=$(cat node_modules/sqlite3/package.json)
sqlite3_version=$(node -e "console.log(JSON.parse(\`$sqlite3_pkg\`).version)")

# download sqlite3 binary that need to pkg
targets=("napi-v3-darwin-unknown-arm64" "napi-v3-darwin-unknown-x64" "napi-v3-win32-unknown-x64" "napi-v3-linux-glibc-x64" "napi-v3-linux-glibc-arm64")
for target in ${targets[@]}; do
  wget https://github.com/TryGhost/node-sqlite3/releases/download/v$sqlite3_version/$target.tar.gz
  tar -zxvf $target.tar.gz
  mv $target ./node_modules/sqlite3/lib/binding
done

npm run build
