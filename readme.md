# Cicada

A multi-user music service for self-hosting.

![version](https://img.shields.io/github/v/release/mebtte/cicada?style=for-the-badge)
![release build](https://img.shields.io/github/actions/workflow/status/mebtte/cicada/build_and_release.yaml?label=release%20build&style=for-the-badge)
![docker build](https://img.shields.io/github/actions/workflow/status/mebtte/cicada/docker_build_and_push.yaml?label=docker%20build&style=for-the-badge)
![license](https://img.shields.io/github/license/mebtte/cicada?style=for-the-badge)

![](./docs/screenshot.png)

## Features

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

知了支持 Docker 部署, **启动容器之前请先参考上面准备知了的配置文件**, 需要注意的是首次运行必须配置 [firstUserEmail](./docs/config/index.md#firstUserEmail), 否则无法完成初始化.

> 通过 Docker 运行知了会忽略配置文件中的 [data](./docs/config/index.md#data) 和 [port](./docs/config/index.md#port)

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

- 知了容器使用 `80` 端口提供服务, `-p 8000:80` 表示映射到宿主的 `8000` 端口
- 知了容器配置文件位于 `/config/cicada.json`, `-v $HOME/cicada/config.json:/config/cicada.json` 表示映射到宿主的 `$HOME/cicada/config.json`
- 知了容器数据保存在 `/data`, `-v $HOME/cicada/data:/data` 表示映射到宿主的 `$HOME/cicada/data`

如果不希望知了容器以 `root` 运行, 可以通过 `--user {uid}:{gid}` 指定.

### Docker compose

```yml
version: '3'
services:
  cicada:
    restart: always
    container_name: cicada

    # 默认使用 root, 也可以通过 user 指定
    # user: 1000:1000

    image: mebtte/cicada
    ports:
      - 8000:80
    volumes:
      - /path/config.json:/config/cicada.json
      - /path/data:/data
```

## 导入音乐

知了支持导入现有音乐, 通过 `cicada import` 命令可以导入音乐目录或者音乐文件, 需要注意的是音乐文件命名必须要满足以下格式(多个空格会被合并成一个):

```txt
singer1[,singer2][,singer3] - name.format
```

比如 `周杰伦 - 晴天.mp3` / `Jarryd James,BROODS - 1000x.flac` 是支持的命名, `孙燕姿 逆光.mp3` / `漠河舞厅.m4a` 是不支持的命名.

```sh
# 导入音乐目录
cicada import --data /path_to/cicada_data --recursive music_dir

# 导入音乐文件
cicada import --data /path_to/cicada_data music
```

当遇到命名不支持或者格式不支持的文件, 知了将会忽略. 可以通过 `cicada help import` 查看更多选项.

## 从 v0 升级到 v1

v0 升级到 v1 需要对数据进行升级后才能启动服务:

```sh
# 进行数据升级前请先备份
cicada data-upgrade <data>
```

也可以通过 Docker 执行:

```sh
# 默认使用 root 用户, 也可以使用 --user {uid}:{gid} 指定
docker run -it --rm -v <data>:/data mebtte/cicada cicada data-upgrade /data
```

如果不想升级到 v1, 请继续使用 [v0](https://github.com/mebtte/cicada/releases/tag/0.78.1) 版本的包或 Docker 镜像使用标签 `mebtte/cicada:v0`.

## 数据修复

由于已知问题的存在, 旧版本的知了一定情况下会导致数据出错, 可以通过 `data-fix` 命令进行修复:

```sh
cicada data-fix <data>
```

也可以通过 Docker 执行:

```sh
# 默认使用 root 用户, 也可以使用 --user {uid}:{gid} 指定
docker run -it --rm -v <data>:/data mebtte/cicada cicada data-fix /data
```

## 常见问题

<details>
  <summary>如何迁移数据 ?</summary>

知了所有数据都位于 `{{data}}` 目录下, 将 `{{data}}` 目录复制或者移动即可完成迁移.

</details>

<details>
  <summary>如何安装 PWA ?</summary>

[PWA](https://developer.mozilla.org/docs/Web/Progressive_web_apps) 仅支持 `HTTPS` 或者 `localhost`, 知了目前暂不支持配置 `HTTPS`, 请使用 `nginx` 之类的工具进行 `HTTPS` 反向代理. Chrome 下安装方法请查看[教程](https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DDesktop).

</details>

<details>
  <summary>为什么 iOS/iPadOS 上处于后台时无法自动播放下一首 ?</summary>

目前 Safari 对 PWA 支持度较低, 当页面处于后台时会暂停 JavaScript 的执行导致无法自动下一首, 需要等待 Safari 提高对 PWA 的支持才能解决相关问题.

</details>

## 后续开发

- [ ] 悬浮歌词面板(类似于网易云音乐网页版歌词)
- [ ] 电台
- [ ] 音乐分享(独立页面, 独立资源链接)

## 开源协议

[GPL](./license)

## 贡献者

<a href="https://github.com/mebtte/cicada/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mebtte/cicada" />
</a>

## 星标历史

[![Star History Chart](https://api.star-history.com/svg?repos=mebtte/cicada&type=Timeline)](https://star-history.com/#mebtte/cicada&Timeline)
