# 知了

知了, 支持多用户的开源音乐服务.

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

## 常见问题

<details>
  <summary>如何迁移数据 ?</summary>

知了所有数据都位于 `{{base}}` 目录下, 将 `{{base}}` 目录复制或者移动即可完成迁移.

</details>

<details>
  <summary>如何安装 PWA ?</summary>

[PWA](https://web.dev/progressive-web-apps) 仅支持 `HTTPS` 或者 `localhost`, `HTTPS` 环境请使用反向代理.

</details>

## 已知缺陷

- 在 iOS/iPadOS 上处于后台无法自动播放下一首, 这是因为 Safari 会暂停处于后台页面的 JavaScript.
- 在 Windows 下安装 PWA 后图标比其他应用图标要小, 这是因为 Windows 和 macOS 的图标占用空间不一致, PWA 无法同时兼容, 知了使用的是 macOS 图标尺寸.

## 开源协议

[GPL](./license)
