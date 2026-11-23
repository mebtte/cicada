# <img src="./apps/pwa/src/static/app_logo_v1.png" alt="Cicada logo" width="36" height="36" /> Cicada

A multi-user music service for self-hosting.

![version](https://img.shields.io/github/v/release/mebtte/cicada?style=for-the-badge)
![license](https://img.shields.io/github/license/mebtte/cicada?style=for-the-badge)

![](./docs/screenshot.png)

## Demo

There is an online demo you can visit on [https://cicada.mebtte.com](https://cicada.mebtte.com), you can login by `username: cicada` and `password: cicada@mebtte`.

## Features

- **No privacy collection** and manage data by yourself
- Single-binary deployment with embedded PWA assets and bundled
  `ffmpeg`/`ffprobe`
- Custom playqueue and share musicbills between users
- Multiple user and support 2FA
- Support lyricist and composer

## Deployment

Download the archive for your platform from
[GitHub Releases](https://github.com/mebtte/cicada/releases). Extract and start the server:

```sh
./cicada start --data /path/to/cicada_data --port 8000
```

On the first startup, Cicada creates a default user and prints `username`/`password` to the log. After startup, you can visit cicada on `http://localhost:8000`.

### Docker CLI

```sh
docker run -d \
  --name cicada \
  --restart unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  mebtte/cicada:v3 start --data /data
```

### Docker Compose

```yaml
services:
  cicada:
    image: mebtte/cicada:v3
    container_name: cicada
    restart: unless-stopped
    ports:
      - 8000:8000
    volumes:
      - ./data:/data
    command: ["start", "--data", "/data"]
```

On the first startup, Cicada creates a default admin user and prints the password to the container log.

## Usage

```console
$ cicada -h
A multi-user music service for self-hosting.

Usage:
  cicada [command]

Available Commands:
  change-password  Change a user's password
  completion       Generate the autocompletion script for the specified shell
  export           Export all music files to a directory
  export-musicbill Export a musicbill's music to a directory (interactive)
  help             Help about any command
  start            Start the cicada server

Flags:
  -h, --help      help for cicada
  -v, --version   version for cicada

Use "cicada [command] --help" for more information about a command.
```

## Contributors

[![Cicada contributors](https://contrib.rocks/image?repo=mebtte/cicada)](https://github.com/mebtte/cicada/graphs/contributors)

## License

[GPL](./license)

