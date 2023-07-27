# Cicada

A multi-user music service for self-hosting.

![version](https://img.shields.io/github/v/release/mebtte/cicada?style=for-the-badge)
![release build](https://img.shields.io/github/actions/workflow/status/mebtte/cicada/build_and_release.yaml?label=release%20build&style=for-the-badge)
![docker build](https://img.shields.io/github/actions/workflow/status/mebtte/cicada/docker_build_and_push.yaml?label=docker%20build&style=for-the-badge)
![license](https://img.shields.io/github/license/mebtte/cicada?style=for-the-badge)

![](./docs/screenshot.png)

## Feature

- No privacy and personal data collection
- Multiple users
- Shared musicbill between users
- Existing music and music directory import
- [PWA](https://developer.mozilla.org/docs/Web/Progressive_web_apps) support both desktop and mobile
- Separation of playlist and custom playqueue
- Music/singer/musicbill/lyric search
- [System media shortcut](https://developer.mozilla.org/docs/Web/API/MediaSession)
- Support of building APP from [HTTP API](./apps/pwa/src/server)

## Preparation

### Email service

Cicada rely on email to send login-code to user, it can prevent password from being brute-forced. You can use free email like [Gmail](https://mail.google.com) or [Outlook](https://outlook.live.com).

## Deployment

Create a JSON file `config.json` and enter email's `SMTP` config:

```json
{
  "emailHost": "smtp.example.com",
  "emailUser": "example@example.com",
  "emailPass": "example-password"
}
```

> Refer to all of configurations on [here](./docs/config/index.md)

Download cicada from [releases](https://github.com/mebtte/cicada/releases) and start server:

> If your platform isn't x64, you can [build cicada](./docs/build/index.md) by yourself

```sh
# It will prompt you to enter admin's email on first run
./cicada start -c config.json
```

Open `localhost:8000` or `{{ip}}:8000` and use the email that you enter on cli to login.

### Docker

You can use docker to deploy cicada, but you need to prepare config file first and must configure [firstUserEmail](./docs/config/index.md#firstUserEmail) on first run.

> Using docker will ignore configuration of [data](./docs/config/index.md#data) and [port](./docs/config/index.md#port)

> There is a [tag](https://hub.docker.com/r/mebtte/cicada/tags) `mebtte/cicada:v0` so you can still run v0

```sh
docker run \
  -d \
  --restart=always \
  -p 8000:80 \
  -v $HOME/cicada/config.json:/config/cicada.json \
  -v $HOME/cicada/data:/data \
  --name cicada \
  mebtte/cicada
```

- Cicada container serve on port `80`
- Configuration file locale `/config/cicada.json`
- Data directory locale `/data`

Also you can use `--user {uid}:{gid}` to map user.

### Docker compose

```yml
version: '3'
services:
  cicada:
    restart: always
    container_name: cicada

    # user mapping
    # user: 1000:1000

    image: mebtte/cicada
    ports:
      - 8000:80
    volumes:
      - /path/config.json:/config/cicada.json
      - /path/data:/data
```

## Music import

You can use `cicada import` to import music file and music directory, but the filename must to fit the blow format:

```txt
singer1[,singer2][,singer3] - name.format
```

For example, `Jarryd James,BROODS - 1000x.flac` / `周杰伦 - 晴天.mp3` is valid and `Numb.m4a` / `Daniel Powter Free Loop.mp3` is invalid, the file has invalid filename will be passed when importing.

```sh
# import direcoty
cicada import --data /path_to/cicada_data --recursive music_directory

# import file
cicada import --data /path_to/cicada_data music
```

## From v0 to v1

If you migrate to v1 from v0, you must to upgrade data before serving:

```sh
# please backup before upgrading
cicada data-upgrade <data>
```

Also docker:

```sh
# --user {uid}:{gid} to map user
docker run -it --rm -v <data>:/data mebtte/cicada cicada data-upgrade /data
```

## Data fixing

According to known issues, some old versions of cicada will breakdown the data, you can fix it by using below command:

```sh
cicada data-fix <data>
```

This command is unharmful, so you can run it even the data isn't broken. Also run the command by docker:

```sh
# --user {uid}:{gid} to map user
docker run -it --rm -v <data>:/data mebtte/cicada cicada data-fix /data
```

## Q & A

<details>
  <summary>How to migrate ?</summary>

All of data is under `{{data}}` directory, copy or move it to new device.

</details>

<details>
  <summary>Why can't play next music on iOS/iPadOS automatically ?</summary>

Because safari unsupport PWA on iOS/iPadOS, there is a plan to develop a App but it is uncertain.

</details>

## License

[GPL](./license)

## Contributor

<a href="https://github.com/mebtte/cicada/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mebtte/cicada" />
</a>

## Star

[![Star History Chart](https://api.star-history.com/svg?repos=mebtte/cicada&type=Timeline)](https://star-history.com/#mebtte/cicada&Timeline)
