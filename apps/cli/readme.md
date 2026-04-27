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
  |- singer_avatar
  |- user_avatar
|- cache # app runtime cache under data, cleaned up periodically
|- logs
|- trash # save removed data temporarily
|- v # its content indicates version of data
|- db # the database of sqlite
|- jwt_secret # its content is secret of jwt
```

## Database structure

Cicada use SQLite as database.

The SQLite schema diagram is maintained in [database.d2](./database.d2) which powered by [d2](https://d2lang.com).

Render the diagram locally with:

```bash
d2 docs/development/database.d2 local_dir/database.svg
```

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

- Alter database must also update [database.d2](./database.d2)
