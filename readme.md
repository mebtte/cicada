# 知了

![version](https://img.shields.io/github/v/release/mebtte/cicada?style=for-the-badge)
![release build](https://img.shields.io/github/actions/workflow/status/mebtte/cicada/build_and_release.yaml?label=release%20build&style=for-the-badge)
![docker build](https://img.shields.io/github/actions/workflow/status/mebtte/cicada/docker_build_and_push.yaml?label=docker%20build&style=for-the-badge)
![license](https://img.shields.io/github/license/mebtte/cicada?style=for-the-badge)

知了, 支持多用户的开源音乐服务.

> 知了已升级到 v1 版本, v0 版本请通过 `cicada data-upgrade <data>` 升级数据后再启动服务, 详细变化可以查看[这里](./apps/server/src/commands/data_upgrade.ts). Docker 镜像也同步升级到 v1, 如果想继续使用 v0 版本的镜像请使用 `mebtte/cicada:v0`.

![](./docs/thumbnail_1.png)
![](./docs/thumbnail_2.png)
![](./docs/thumbnail_3.png)

## 特色

- **尊重隐私, 不进行任何数据收集**
- 支持多用户以及导入现有音乐目录/文件
- 同时支持桌面端和移动端的 [PWA](https://developer.mozilla.org/docs/Web/Progressive_web_apps)
- 乐单/播放列表/播放队列音乐数量无限制
- 支持标注音乐创作来源(翻唱)
- 支持歌词/歌名/歌手/乐单搜索
- 暴露 [HTTP API](./apps/pwa/src/server) 支持第三方接入或进行二次开发
- 系统媒体和快捷键支持
- 支持音乐播放记录

## 准备

- **[邮件发送服务](https://zh.wikipedia.org/wiki/%E7%AE%80%E5%8D%95%E9%82%AE%E4%BB%B6%E4%BC%A0%E8%BE%93%E5%8D%8F%E8%AE%AE)**, 知了使用邮箱验证码进行登录以及部分功能依赖邮箱实现, 第三方邮件发送服务可以参考 [网易邮箱](https://note.youdao.com/ynoteshare/index.html?id=f9fef46114fb922b45460f4f55d96853) / [QQ 邮箱](https://service.mail.qq.com/cgi-bin/help?subtype=1&id=28&no=1001256) / [Outlook 邮箱](https://support.microsoft.com/zh-cn/office/pop-imap-%E5%92%8C-smtp-%E8%AE%BE%E7%BD%AE-8361e398-8af4-4e97-b147-6c6c4ac95353)

> 使用邮箱验证码登录可以极大地提高安全性, 相比账号密码的登录方式, 邮箱验证码登录可以避免被暴力破解

## 部署

新建配置文件 `config.json`:

```json
{
  "emailHost": "smtp.example.com",
  "emailUser": "example@example.com",
  "emailPass": "example-password"
}
```

> 完整配置可以参看[配置项](./docs/config/index.md), 支持 JSON/[JSON5](https://json5.org) 语法.

在 [Releases](https://github.com/mebtte/cicada/releases) 下载并解压对应平台的二进制包, 通过下面命令指定配置文件并启动服务:

```sh
./cicada start -c config.json
```

通过 `localhost:8000` 或者 `{{ip}}:8000` 访问知了服务. 目前只提供了几种主流平台的构建包, 其他平台可以参考[构建文档](./docs/build/index.md)自行构建.

### Docker

知了支持 Docker 部署, **启动容器之前请先参考上面准备知了的配置文件**, 下面例子中配置文件位于 `$HOME/cicada/config.json`, 需要注意的是首次运行必须配置 [initialAdminEmail](./docs/config/index.md#initialadminemail), 否则无法完成初始化. 此外在 Docker 中知了会忽略配置文件中的 [data](./docs/config/index.md#data) 和 [port](./docs/config/index.md#port) 配置项.

> [0.76.0](https://github.com/mebtte/cicada/releases/tag/0.76.0) 版本以及之后的版本 Docker 镜像中配置文件从 `/config.json` 移至 `/config/cicada.json`, 为了兼容旧版本, 当 `/config/cicada.json` 不存在时会自动查找 `/config.json`. 此兼容将会在 v1 版本移除.

```sh
docker run \
  -d \
  --restart=always \
  -p 8000:80 \
  -v $HOME/cicada/data:/data \
  -v $HOME/cicada/config.json:/config/cicada.json:ro \
  --name cicada \
  mebtte/cicada
```

- `-p 8000:80` 表示宿主的 `8000` 端口映射容器的 `80` 端口, 知了容器使用 `80` 端口提供服务, 可以使用 `-p {port}:80` 映射其他端口
- `-v $HOME/cicada/data:/data` 表示宿主的 `$HOME/cicada/data` 目录映射容器的 `/data` 目录, 知了容器使用 `/data` 目录保存数据
- `-v $HOME/cicada/config.json:/config/cicada.json:ro` 表示宿主的 `$HOME/cicada/config.json` 文件映射容器的 `/config/cicada.json` 文件, 知了容器配置文件位于 `/config/cicada.json`, `ro` 表示只读. 如果你的环境不支持文件映射, 当前例子可以使用目录映射 `-v $HOME/cicada:/config:ro`

如果希望知了容器不以 `root` 用户运行, 可以使用 `-u {uid}:{gid}` 进行用户映射.

### Docker compose

```yml
version: '3'
services:
  cicada:
    restart: always
    container_name: cicada

    # specify user
    # user: 1000:1000

    image: mebtte/cicada
    ports:
      - 8000:80
    volumes:
      - /path/config.json:/config/cicada.json:ro
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

## Roadmap

### v1

- [ ] 图片(用户头像/歌手头像/音乐封面/乐单封面)访问优化
- [ ] 删除用户
- [ ] 用户最后活动时间记录和展示
- [ ] 音乐年份记录和展示
- [ ] 共享乐单
- [ ] 消息中心(删除歌手消息/乐单内包含被删除音乐消息)

### 待定

- [ ] 悬浮歌词面板(类似于网易云网页版歌词)
- [ ] 电台功能(随机从曲库中拉取音乐并连续播放)

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

## 开源协议

[GPL](./license)

## 贡献者

<a href="https://github.com/mebtte/cicada/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mebtte/cicada" />
</a>

## 星标历史

[![Star History Chart](https://api.star-history.com/svg?repos=mebtte/cicada&type=Timeline)](https://star-history.com/#mebtte/cicada&Timeline)
