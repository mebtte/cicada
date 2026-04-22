# Apple

SwiftUI multiplatform client scaffold for `cicada`.

## Requirements

- xCode

## Targets

- `iOS`
- `iPadOS` via the shared `iOS` destination and `TARGETED_DEVICE_FAMILY=1,2`
- `macOS`

## Generate Project

```sh
cd apps/apple
xcodegen generate
```

This spec generates [Cicada.xcodeproj](/Users/slave/project/cicada/apps/apple/Cicada.xcodeproj).

## Open Project

```sh
open apps/apple/Cicada.xcodeproj
```

## Build From CLI

If `xcode-select -p` still points at `/Library/Developer/CommandLineTools`, run `xcodebuild` with an explicit developer directory:

```sh
cd apps/apple
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project Cicada.xcodeproj -scheme Cicada -destination 'generic/platform=macOS' build
```

## Notes

- The shared app target lives in [project.yml](/Users/slave/project/cicada/apps/apple/project.yml).
- Runtime platform differences are handled in [PlatformInfo.swift](/Users/slave/project/cicada/apps/apple/Cicada/Support/PlatformInfo.swift).
- Verified with `xcodebuild` for `generic/platform=macOS` and `generic/platform=iOS`.
