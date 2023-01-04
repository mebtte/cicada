# 知了

知了, 支持多用户的开源音乐服务. 更多请看[详细介绍](https://mebtte.com/introducing_cicada).

![](./docs/thumbnail_1.png)
![](./docs/thumbnail_2.png)
![](./docs/thumbnail_3.png)

## 准备

- 邮箱账号, 因为知了依赖邮箱验证码进行登录, 以及部分功能需要依赖邮箱实现, 所以需要邮箱服务进行邮件发送

## 部署

新建配置文件 `config.json`:

```json
{
  "emailHost": "smtp.example.com",
  "emailUser": "example",
  "emailPass": "example-password"
}
```

> 完整配置可以参看[配置项](./docs/config/index.md), 支持 JSON/[JSON5](https://json5.org) 语法.

在 [Releases](https://github.com/mebtte/cicada/releases) 下载并解压对应平台的二进制包, 通过下面命令指定配置文件并启动(以 x64 Linux 为例):

```sh
./cicada-linux-x64 start -c config.json
```

通过 `localhost:8000` 或者 `{{ip}}:8000` 访问知了服务.

目前只提供了几种主流平台的构建包, 其他平台可以参考[构建文档](./docs/build/index.md)自行构建.

### Docker

知了支持 Docker 镜像部署:

```sh
docker run -d --restart=always -p 8000:80 -v $HOME/cicada:/data -v $HOME/config.json:/config.json --name cicada mebtte/cicada
```

Docker 镜像配置文件位于 `/config.json`, 数据目录位于 `/data`. 需要注意的是, 使用 Docker 镜像首次运行必须配置 [initialAdminEmail](./docs/config/index.md#initialadminemail), 否则无法完成初始化. 此外 [data](./docs/config/index.md#data) 和 [port](./docs/config/index.md#port) 配置项使用 Docker 镜像不再生效.

## 常见问题

<details>
  <summary>如何迁移数据 ?</summary>

知了所有数据都位于 `{{base}}` 目录下, 将 `{{base}}` 目录复制或者移动即可完成迁移.

</details>

<details>
  <summary>如何安装 PWA ?</summary>

[PWA](https://developer.mozilla.org/docs/Web/Progressive_web_apps) 仅支持 `HTTPS` 或者 `localhost`, 知了目前暂不支持配置 `HTTPS`, 请使用 `nginx` 之类的工具进行 `HTTPS` 反向代理. Chrome 下安装方法请查看[教程](https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DDesktop).

</details>

## 已知缺陷

- 在 iOS/iPadOS 上处于后台无法自动播放下一首, 这是因为 Safari 会暂停处于后台页面的 JavaScript.
- 在 Windows 下安装 PWA 后图标比其他应用图标要小, 这是因为 Windows 和 macOS 的图标占用空间不一致, PWA 无法同时兼容, 知了使用的是 macOS 图标尺寸.

## 开源协议

[GPL](./license)
