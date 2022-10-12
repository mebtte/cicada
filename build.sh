#!/usr/bin/env bash
set -e

npm install

# # get sqlite3 version
sqlite3_pkg=$(cat node_modules/sqlite3/package.json)
sqlite3_version=$(node -e "console.log(JSON.parse(\`$sqlite3_pkg\`).version)")

# # download sqlite3 binary that need to pkg
targets=("napi-v6-darwin-unknown-x64" "napi-v6-win32-unknown-x64" "napi-v6-linux-glibc-x64")
for target in ${targets[@]}; do
  wget https://github.com/TryGhost/node-sqlite3/releases/download/v$sqlite3_version/$target.tar.gz
  tar -zxvf $target.tar.gz
  cp -rf $target ./node_modules/sqlite3/lib/binding
  rm -rf $target.tar.gz
  rm -rf $target
done

npm run build:pwa
npm run build:server

# write pkg targets to package.json
pkg=$(cat package.json)
node -e "const pkg = JSON.parse(\`$pkg\`); pkg.pkg.targets = [\"node16-macos-x64\",\"node16-win-x64\",\"node16-linux-x64\"]; console.log(JSON.stringify(pkg))" >package.json

if [ -d "build" ]; then
  rm -rf build
fi
npm run pkg

# recover package.json
echo $pkg >package.json

cd build
for binary in ./*; do
  tar zcvf $binary.tar.gz $binary
  rm $binary
done
