#!/usr/bin/env bash
set -e

npm ci --prefix apps/cli
npm ci --prefix apps/pwa

mkdir -p cache

# get sqlite3 version
sqlite3_pkg=$(cat apps/cli/node_modules/sqlite3/package.json)
sqlite3_version=$(node -e "console.log(JSON.parse(\`$sqlite3_pkg\`).version)")

# download sqlite3 binary that need to pkg
if [[ $1 == "docker" ]]; then
  targets=("napi-v6-linux-glibc-x64")
else
  targets=("napi-v6-darwin-unknown-x64" "napi-v6-win32-unknown-x64" "napi-v6-linux-glibc-x64")
fi

for target in ${targets[@]}; do
  if [ -f cache/$target.tar.gz ]; then
    echo "$target.tar.gz has cache and skip to download."
  else
    wget -P cache https://github.com/TryGhost/node-sqlite3/releases/download/v$sqlite3_version/$target.tar.gz
  fi

  tar -zxvf cache/$target.tar.gz
  cp -rf $target ./apps/cli/node_modules/sqlite3/lib/binding
  rm -rf $target
done

npm run build --prefix apps/pwa
npm run build --prefix apps/cli

# backup package.json
cp apps/cli/package.json apps/cli/package.json.bak

# write pkg targets to package.json
pkg="$(cat apps/cli/package.json)"
if [[ $1 == "docker" ]]; then
  node -e "const pkg = JSON.parse(\`$pkg\`); pkg.pkg.targets = [\"node18-linux-x64\"]; console.log(JSON.stringify(pkg))" >apps/cli/package.json
else
  node -e "const pkg = JSON.parse(\`$pkg\`); pkg.pkg.targets = [\"node18-macos-x64\",\"node18-win-x64\",\"node18-linux-x64\"]; console.log(JSON.stringify(pkg))" >apps/cli/package.json
fi

if [ -d "build" ]; then
  rm -rf build
fi
npm run pkg --prefix apps/cli

# recover package.json
rm apps/cli/package.json
mv apps/cli/package.json.bak apps/cli/package.json

if [[ $1 == "docker" ]]; then
  echo 'skip compression on docker building.'
else
  cd build
  tag=$(git describe --abbrev=0 --tags)
  for binary in ./*; do
    tar zcvf $(echo $binary | sed -e 's/.exe//g')-x64-$tag.tar.gz $binary
    rm $binary
  done
fi
