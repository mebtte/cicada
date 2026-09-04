# Development

Cicada is monorepo which has multiple apps:

- apps/cli: CLI tool for serving data and managing data, powered by `go`. See the [development docs](../../apps/cli/readme.md).
- apps/pwa: Client for browser, powered by `react`/`typescript`. See the [development docs](../../apps/pwa/readme.md).
- apps/apple: Client for iOS/iPadOS/macOS, powered by `swift`. See the [development docs](../../apps/apple/readme.md).

## Nouns

| English   | Chinese  | Remark                                                       |
| --------- | -------- | ------------------------------------------------------------ |
| Musicbill | 乐单     | A collection of musics                                       |
| Playqueue | 播放队列 | A queue for playing musics, it has sequence                  |
| Playlist  | 播放列表 | A collection for playing musics, each music inside is unique |

## Application Versioning

CLI, PWA, and Apple clients use the same application version format.

The base version must come from a Git tag in `MAJOR.MINOR.PATCH` form, for
example `3.5.0`. If a build has extra meaning, append `-{description}` to the
base version.

Current build scenarios:

| Scenario | Format | Example |
| -------- | ------ | ------- |
| Release build | `{tag}` | `3.5.0` |
| Local development | `{tag}-local` | `3.5.0-local` |
| Docker beta v3 | `{tag}-beta.{YYMMDDHHmm}` | `3.5.0-beta.2606181430` |

When comparing application versions, strip the first `-{description}` suffix
before comparing. For example, `3.5.0-local` and `3.5.0-beta.2606181430` both
compare as `3.5.0`.

Builds must fail when an application version does not match the format above.
This includes explicit overrides such as `CICADA_VERSION` or Makefile
`VERSION`.

This rule is only for the Cicada application version. It does not apply to
dependency versions, OpenAPI versions, data migration versions, cache keys, or
Docker major tags such as `v3`.

Apple builds keep `CFBundleShortVersionString` as the base version for platform
compatibility. The full Cicada application version is stored in `CicadaVersion`
and is the value used when talking to the server.

## Embedded Tools

Embedded executable files live directly in `scratch/bin`. The complete inventory
is passed to `internal/embeddedtools.Prepare` from the FFmpeg startup preparation;
add any future tools to that inventory so cleanup retains them. Preparation runs
after scratch migration and before the server or scheduler starts. It reuses
identical files, stages replacements beside their destinations, and removes
obsolete entries only after every current tool is ready. The bin directory is
program-owned and must not be a symlink or shared by running instances.

## Data and Scratch Migrations

Data and scratch share one migration version sequence, but store progress
separately in `data/v` and `scratch/v`. Startup completes data migration first,
then runs scratch migration to the resulting data version before starting the
server or scheduler. Always check scratch progress, including when data is
already current: synchronized data may have been upgraded on another device
while this device's scratch still has an older layout.

Version 123 is the scratch baseline. An existing scratch directory without `v`
is adopted at that version without clearing its contents, then follows newer
registered steps. Invalid markers and scratch versions newer than data must
fail without deleting files. A successful data upgrade is not rolled back if
scratch fails; the next startup recovers and retries scratch independently.

When adding a migration:

- Add a new registered `Migration`; do not edit historical migration scripts.
- Keep persistent data changes in `Migration.Up`. It must not modify scratch:
  that callback may already have run on another device.
- Put local layout changes in the optional `Migration.ScratchUp` callback,
  which receives `ScratchEnv{ScratchDir, Journal}`. Resolve paths under the
  supplied `ScratchDir`, not under data or through global configuration.
- Leave `ScratchUp` nil when the change does not affect scratch. The runner
  advances the local version marker without clearing caches or other files.
- Preserve reusable files. Prefer a journaled rename for a compatible layout
  change; convert or remove only the affected entries when a format cannot be
  reused. A data version increase alone is not a reason to clear scratch.
- Use the journal for scratch file changes so interrupted or failed migrations
  can recover. Use `ScratchEnv.EnsureDir` for required directories rather
  than untracked filesystem writes. Do not bypass the journal with direct
  rename, overwrite, or deletion operations.

Test the scratch callback with reusable existing files, an older local marker
paired with already-upgraded data, and interrupted operations. Also cover
nil callbacks retaining caches, adoption without a marker, invalid/newer
markers preserving files, and scratch failure after data commit followed by a
successful retry. Migration version numbers are independent of application
release versions and cache filename versions.

## Rules

- Variables prefer lower-camel case
- Uses english as commit message

---

If you have other questions, you can make a [issue](https://github.com/mebtte/cicada/issues).
