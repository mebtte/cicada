# CLI

Currently, `cicada` can be run on:

- AMD64
  - Linux
  - macOS
  - Windows
- ARM64
  - Linux
  - macOS
  - Windows

## Requirement

- Go environment
- Node.js environment

## Embedded ffmpeg Bundle

Production builds can embed `ffmpeg` and `ffprobe` directly into the CLI binary.

By default, `make release` now downloads upstream binaries automatically for every target:

```sh
make release
```

Current default providers are:

- `darwin/amd64`: Evermeet release ZIP endpoints
- `darwin/arm64`: osxexperts Apple Silicon builds
- `linux/*`, `windows/*`: BtbN latest GPL archives

You can still override the download source per target:

```sh
FFMPEG_ARCHIVE_LINUX_AMD64=/path/to/custom-linux-amd64.tar.xz make ffmpeg-bundle-linux-amd64
```

For targets that distribute `ffmpeg` and `ffprobe` separately, use:

```sh
FFMPEG_FFMPEG_SOURCE_DARWIN_ARM64=/path/to/ffmpeg.zip \
FFMPEG_FFPROBE_SOURCE_DARWIN_ARM64=/path/to/ffprobe.zip \
make ffmpeg-bundle-darwin-arm64
```

Optional `FFMPEG_SHA256_<TARGET>` variables can be used to verify custom archive overrides before embedding.

Embedded `ffmpeg` and `ffprobe` are extracted at runtime into the OS user cache directory returned by `os.UserCacheDir()`, not `CICADA_DATA/cache`.

## Data structure

All of `cicada` data is under a directory, here is its structure:

```
|- assets
  |- music
  |- musicbill_cover
  |- music_cover
  |- singer_photo
  |- user_avatar
|- cache # app runtime cache under data, cleaned up periodically
  |- thumbnails # resized asset thumbnails
|- logs
  |- access # JSONL HTTP access logs, rotated daily and cleaned up periodically
  |- scheduler # JSONL scheduler job logs, rotated daily and cleaned up periodically
|- v # data version (monotonic integer, see "Data version" below)
|- db # the database of sqlite
|- jwt_secret # its content is secret of jwt
```

During an in-progress data upgrade these transient files / directories may be present and are cleaned up automatically once the upgrade succeeds (or once the next startup recovers a crashed upgrade):

```
|- db.backup       # VACUUM INTO snapshot of db taken before migrations run
|- upgrade.lock    # JSON state of the in-flight upgrade (from, to, pid, lastApplied)
|- upgrade.journal # append-only JSONL of file operations performed by migrations
|- upgrade.trash   # files moved aside by migrations, restored on rollback
```

## Data version

The `v` file holds a monotonic integer that is **independent of the CLI's git tag version**. It is bumped only when a migration is added to `internal/store/migration`.

- Baseline of the new scheme is `100`. Pre-`v3` binaries wrote `1` or `2`; on first start of a binary using this scheme, those values are auto-bridged to `100` (no schema change).
- A binary supports a range `[BaselineVersion, CurrentVersion]`. Starting against newer data refuses with an explicit "please upgrade cicada".
- Schema upgrades run automatically at startup, including destructive ones: each upgrade first does `VACUUM INTO db.backup` and runs every migration inside a transaction with file-system operations recorded in `upgrade.journal`. A crash mid-upgrade is rolled back on the next start.

## Start DEV Server

In development, `cicada` uses [air](https://github.com/air-verse/air) to start dev server. First, you need to install it.

```sh
go install github.com/air-verse/air@latest
```

Then you need to add go bin to `PATH`:

```sh
export PATH=$PATH:$(go env GOPATH)/bin
```

Use the follow command to start dev server:

```sh
CICADA_DATA=/path_to/data air
```

`/path_to/data` means the directory of the data, you should replace to yours.

On the first local `air` run, the current host platform bundle is prepared automatically before build. For example, Apple Silicon macOS resolves to `darwin-arm64`.

And the server can be visited on `http://localhost:8000`.

## API Reference

After starting dev server, the API reference can be visited on `http://localhost:8000/api_reference`.

## Rules

- Any change to schema or to the on-disk layout under the data directory must ship as a new file in `internal/store/migration/` that calls `migration.Register` from `init()` — never edit the baseline DDL in `internal/store/schema.go` after release.
- Each schema migration must add a new `changelog/database.v<to_version>.d2` snapshot reflecting the post-migration schema, plus an entry in [`changelog/database.changelog.md`](./changelog/database.changelog.md). Existing snapshots are immutable history and must not be modified.
- Each migration that changes the data directory layout (renames, new dirs, asset moves) must add an entry in [`changelog/data.changelog.md`](./changelog/data.changelog.md).
