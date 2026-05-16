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
    command: ["start"]
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      CICADA_DATA: /data
      CICADA_PORT: 8000
    volumes:
      - ./data:/data
```

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
This directory contains the SQLite database, uploaded assets, logs, cache, and
data-version files. Back it up before upgrading or moving the service to another
host.

## Upgrade

Pull the latest v3 image and recreate the container:

```sh
docker compose pull
docker compose up -d
```

Cicada runs required data migrations automatically during startup.

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
  mebtte/cicada:v3 start
```
