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
be recovered. Cache files are regenerated according to the selected music
transcoding mode. Moving scratch reduces synchronized data, but does not
guarantee lower total disk usage. Music caches are independent files; source
formats that can be reused are copied rather than hard-linked.

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

## Music Transcoding

Choose a server-wide mode at startup:

```sh
cicada start --music-transcode=eager  # default
cicada start --music-transcode=lazy
```

- `eager` pretranscodes both music quality levels in the background. Valid
  caches are retained indefinitely; scheduled cleanup removes invalid caches.
- `lazy` does not register the background pretranscoding job. Playback requests
  generate missing caches on demand, and daily cleanup also removes caches
  unused for more than 60 days. This favors limited storage and libraries where
  only a small subset is played regularly.

Both modes wait for the whole file to finish transcoding on a cache miss before
returning audio. Each server request using a cache updates that audio file's
modification time, including Range, HEAD, and conditional requests. Quality
levels are timed independently. Browser or proxy cache hits that never reach
Cicada do not renew the server cache. Background checks of existing caches do
not renew them either. New caches start their 60-day period when generated.

The lazy expiry threshold is strictly more than 60 × 24 hours since the last
access. Cleanup runs daily at 04:10 in the server's local timezone; it skips
caches currently being generated or served. An expired cache that is accessed
before cleanup can still be reused and renewed. This retention policy does not
impose a disk-capacity limit. Invalid caches are cleaned in either mode.

Restart with the other mode to switch behavior; compatible caches remain.
Switching to lazy makes existing caches eligible for expiry based on their
modification times. Invalid parameter values stop startup. There is no
corresponding environment variable.

This change advances the data version by one and discards older music caches
through the local scratch migration, including their metadata. Uploaded assets
and business database contents are preserved. New music caches never use hard
links, so access updates cannot change original file timestamps. In eager mode,
background jobs and requests rebuild caches; in lazy mode, only requests do.
The first playback after upgrading may therefore require transcoding. Keep a
pre-upgrade backup if you need to return to a previous binary.

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
