# Cicada

A multi-user music service for self-hosting.

![version](https://img.shields.io/github/v/release/mebtte/cicada?style=for-the-badge)
![license](https://img.shields.io/github/license/mebtte/cicada?style=for-the-badge)

## Features

- **No privacy collection**
- Single-binary deployment with embedded PWA assets and bundled
  `ffmpeg`/`ffprobe`
- Batch music import and manage data by yourself
- Custom playqueue and share musicbills between users
- Support 2FA

## Demo

There is a online demo you can visit on [https://cicada.mebtte.com](https://cicada.mebtte.com), you can login by `username: cicada` and `password: cicada`. **The demo data resets every six hours.**

> Attention: this account isn't a administrator, so you can't manage the data.

## Deploy

> If you use docker, see this [docs](./docs/docker_deployment/index.md).

Download the archive for your platform from
[GitHub Releases](https://github.com/mebtte/cicada/releases). Extract and start the server:

```sh
./cicada start --data /path/to/cicada_data --port 8000
```

On Windows, use `cicada.exe`:

```powershell
.\cicada.exe start --data C:\path\to\cicada_data --port 8000
```

`--data` is optional and defaults to `cicada_data` next to the executable.
`--port` is optional and defaults to `8000`. You can also configure them with
`CICADA_DATA` and `CICADA_PORT`.

Open `http://localhost:8000` after the server starts.

## Development

If you are interested in developing `cicada`, see the development [docs](./docs/development/index.md).

## License

[GPL](./license)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=mebtte/cicada&type=Date)](https://star-history.com/#mebtte/cicada&Date)
