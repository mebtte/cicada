# Docker Deployment

The official Docker image is published to Docker Hub:

```txt
mebtte/cicada:v3
```

`v3` tracks the latest major-version-3 release.

```yaml
services:
  cicada:
    image: mebtte/cicada:v3
    container_name: cicada
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./data:/data
    command: ["start", "--data", "/data"]
```

On the first startup, Cicada creates a default admin user and prints the password to the container log.

```sh
docker logs cicada
```

The default username is `cicada`. Save the generated password before clearing the logs.

Run with plain Docker instead of Compose:

```sh
docker run -d \
  --name cicada \
  --restart unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  mebtte/cicada:v3 start --data /data
```
