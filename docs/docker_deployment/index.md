# Docker Deployment

The official Docker image is published to Docker Hub:

```txt
mebtte/cicada:v3
```

`v3` tracks the latest major-version-3 release. Pull the image again when you
want to upgrade within the v3 line.

## Docker Compose

Create `compose.yaml`:

```yaml
services:
  cicada:
    image: mebtte/cicada:v3
    container_name: cicada
    command: ["start", "--scratch", "/scratch"]
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      CICADA_DATA: /data
      CICADA_PORT: 8000
    volumes:
      - ./data:/data
      - /device-local/cicada-scratch:/scratch
```

Replace `/device-local/cicada-scratch` with a writable host directory outside
your synchronized data. Use a separate scratch mount for each data directory.

Start the service:

```sh
docker compose up -d
```

Open `http://localhost:8000` after the container starts.

## First Login

On the first startup, Cicada creates a default admin user and prints the
password to the container log.

```sh
docker logs cicada
```

The default username is `cicada`. Save the generated password before clearing
the logs.

## Data Directory

The compose example mounts `./data` on the host to `/data` in the container.
This directory contains the SQLite database, uploaded assets, data-version files,
and other persistent data. Back it up before upgrading or moving the service to
another host.

The example separately mounts a device-local directory at `/scratch` and passes
`--scratch /scratch`. Scratch contains `bin`, `thumbnails`, `music_transcoded`,
`partial_uploads`, and `logs/access` and `logs/scheduler`, without a nested
`cache` directory. Its `v` file tracks local upgrade progress. Missing directories are created at startup; invalid or
unwritable paths prevent startup. Container mount permissions must allow Cicada
to write to both data and scratch.

`scratch/bin` is reserved for embedded executables. At startup, Cicada reuses
identical tools, replaces changed or missing tools via files staged in the same
directory, then removes obsolete entries. Do not put your own files there or
share scratch between running instances. The scratch mount must allow execution
of these tools (it cannot be mounted with `noexec`).

Without `--scratch`, the default is `<data>/scratch`, which still participates
in data-directory synchronization. Relative paths are resolved from the process
working directory inside the container. There is no scratch environment variable;
use the command argument. Startup output shows the resolved scratch path.

Stop the service before clearing scratch or changing its location. Missing
scratch is recreated on startup, but its historical logs and unfinished uploads
are lost. Music caches are rebuilt according to the selected transcoding mode.
Moving scratch does not guarantee a smaller total disk footprint: cache
regeneration consumes space, and reusable source-quality files are copied into
independent caches rather than hard-linked.

## Music Transcoding Mode

The default `eager` mode generates music caches in the background and retains
valid caches indefinitely. For limited storage, choose `lazy` in the Compose
command and recreate the container:

```yaml
command: ["start", "--scratch", "/scratch", "--music-transcode=lazy"]
```

With plain Docker, append `--music-transcode=lazy` after `start`. The option is
server-wide and accepts only `eager` or `lazy`; invalid values stop startup.
There is no corresponding environment variable. Restart with
`--music-transcode=eager` or omit the option to restore the default.

Lazy mode generates missing caches when requested and has no background
pretranscoding job. The first request waits for the whole file to finish
transcoding. Every server request using a cache refreshes that audio file's
modification time; the two quality levels are tracked independently. Requests
served entirely by a browser or proxy cache do not refresh server timestamps,
and background checks do not renew existing caches.

Daily cleanup at 04:10 in the container's local timezone removes lazy caches
unused for more than 60 × 24 hours, alongside invalid caches. Active generation
and responses are protected. Existing caches remain when switching modes, but
switching to lazy makes them subject to expiry. Expiry reduces idle cache
storage; it does not guarantee a maximum disk footprint. Eager mode only
cleans invalid caches.

The music cache change advances the data version by one. Its local scratch
migration discards old music caches and metadata, preserving uploaded files
and business database contents. New caches use independent files, never hard
links. They are rebuilt by background jobs or requests in eager mode, and only
by requests in lazy mode. Allow for cache regeneration after upgrading.

## Upgrade

Pull the latest v3 image and recreate the container:

```sh
docker compose pull
docker compose up -d
```

Cicada runs required data migrations automatically during startup. The scratch
layout advances the data version and deletes the old `<data>/cache`,
`<data>/partial_uploads`, and `<data>/logs` once, without migrating their contents.
Original assets and database contents remain. Finish uploads and save required
logs before upgrading; caches will be regenerated. Do not point scratch at or
inside those old directories, including through symbolic links.

Older binaries may refuse the upgraded data version. Keep a pre-upgrade backup
if you need to restore the previous release; switching the image back alone is
not a supported rollback.

On every startup, Cicada upgrades data first and then local scratch, even if
another device has already upgraded the synchronized data. `scratch/v` tracks
this device's progress toward the data version. Existing scratch without that
file is adopted at baseline 123 without clearing its contents, then upgraded
as needed. Data-only changes advance the marker without deleting caches;
future scratch changes preserve compatible files and only convert or remove
formats that cannot be reused.

An invalid scratch version or one newer than data prevents startup and preserves
the files. If data upgrades successfully but scratch fails, the service stays
stopped; retry startup to recover and upgrade scratch. The successful data
upgrade is not rolled back. Keep `scratch/v` with its directory rather than
editing or removing it separately.

## Useful Commands

Stop the service:

```sh
docker compose down
```

Follow logs:

```sh
docker logs -f cicada
```

Run with plain Docker instead of Compose:

```sh
docker run -d \
  --name cicada \
  --restart unless-stopped \
  -p 8000:8000 \
  -e CICADA_DATA=/data \
  -e CICADA_PORT=8000 \
  -v "$(pwd)/data:/data" \
  -v /device-local/cicada-scratch:/scratch \
  mebtte/cicada:v3 start --scratch /scratch
```
