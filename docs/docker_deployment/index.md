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
`--scratch /scratch`. Scratch contains `thumbnails`, `music_transcoded`,
`partial_uploads`, and `logs/access` and `logs/scheduler`, without a nested
`cache` directory. Its `v` file tracks local upgrade progress. Missing directories are created at startup; invalid or
unwritable paths prevent startup. Container mount permissions must allow Cicada
to write to both data and scratch.

Without `--scratch`, the default is `<data>/scratch`, which still participates
in data-directory synchronization. Relative paths are resolved from the process
working directory inside the container. There is no scratch environment variable;
use the command argument. Startup output shows the resolved scratch path.

Stop the service before clearing scratch or changing its location. Missing
scratch is recreated on startup, but its historical logs and unfinished uploads
are lost. Music pretranscoding and scheduled cleanup keep their existing
behavior. Moving scratch does not guarantee a smaller total disk footprint:
cache regeneration consumes space, and source-quality caches may need copies
instead of hard links across separate filesystems.

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
