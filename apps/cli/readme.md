# CLI

Currently, `cicada` can be run on:

- AMD64
  - Linux
  - Windows
- ARM64
  - Linux
  - macOS
  - Windows

## Requirement

- Go environment
- Node.js environment

## Debug command

```sh
cd apps/cli
go run . --help
```

## Scratch Directory

`cicada start --scratch <path>` places generated and temporary files outside
of the data directory:

```sh
cicada start --data ~/Sync/cicada-test-data --scratch ~/.cache/cicada-test
```

The default is `<data>/scratch`. Relative paths are resolved from the process
working directory, and the resolved path is printed at startup. There is no
scratch environment variable. Missing parent directories and required
subdirectories are created automatically; an unusable path prevents startup.

```text
scratch/
  v
  thumbnails/
  music_transcoded/
  partial_uploads/
  logs/
    access/
    scheduler/
```

Keep a separate scratch directory for each data directory. To exclude these
files from synchronization, explicitly choose a path outside the synchronized
directory. The default remains inside data. Scratch must not overlap the old
`data/cache`, `data/partial_uploads`, or `data/logs` directories, including through
symbolic links, because the upgrade removes those directories.

Stop the service before clearing scratch or changing its location. It can be
recreated on the next start, but unfinished uploads and historical logs cannot
be recovered. Cache files are regenerated. Music pretranscoding, cache reuse,
and scheduled cleanup remain enabled with their existing rules. Moving scratch
reduces synchronized data, but does not guarantee lower total disk usage;
source-quality files that could previously use hard links may require copies
when scratch and assets are on different filesystems.

### Upgrade

The scratch layout advances the data version. On upgrade, Cicada automatically
removes the old `<data>/cache`, `<data>/partial_uploads`, and `<data>/logs` once,
without copying their contents. Original assets and database contents remain.
Finish active uploads before upgrading and save any logs you need. Existing
caches will be regenerated, which can temporarily increase CPU and disk load.
Back up the data before upgrading: older binaries may refuse the upgraded data
version and cannot be used for a direct rollback.

Scratch also has its own `v` file. It records this device's upgrade progress;
its target is the current data version, rather than a separate version series.
On every startup, Cicada upgrades data first, then upgrades local scratch before
starting the service. This still runs when another device has already upgraded
and synchronized data, so each device's scratch can catch up independently.

An existing scratch directory without `v` is adopted at baseline version 123
without clearing its contents, then any newer scratch migrations run. A data
migration with no scratch changes only advances the scratch version marker.
Compatible caches are retained; future layout migrations can move files, and
only incompatible formats need targeted conversion or removal.

An invalid scratch version or one newer than the data version stops startup and
preserves the files. If the data upgrade succeeds but the scratch upgrade fails,
startup stops; retrying completes local scratch recovery and migration without
rolling back the successful data upgrade. Do not edit or remove only `scratch/v`
to bypass a version error, since it records which migrations have been applied.

## Start DEV Server

In development, `cicada` uses [air](https://github.com/air-verse/air) to start dev server. First, you need to install it.

```sh
go install github.com/air-verse/air@latest
```

Run the following command from `apps/cli` to start the dev server:

```sh
air -- start --data /path_to/data
```

`/path_to/data` means the directory of the data, you should replace to yours. And the server can be visited on `http://localhost:8000`.

## API Reference

After starting dev server, the API reference can be visited on `http://localhost:8000/apidoc`.
