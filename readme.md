# 知了

知了, 一个支持多用户的自主托管音乐服务.

![](./docs/thumbnail_1.png)
![](./docs/thumbnail_2.png)

## 准备

- 邮箱账号, 用于发送邮件

## 部署

新建配置文件 `config.json`:

```json
{
  "emailHost": "smtp.example.com",
  "emailUser": "example",
  "emailPass": "example-password"
}
```

在 [Releases](https://github.com/mebtte/cicada/releases) 下载并解压对应平台的二进制包, 通过下面命令指定配置文件并启动(以 x64 Linux 为例):

```sh
./cicada-linux-x64 --config config.json
```

> 目前只提供了几种主流平台的构建包, 其他平台可以参考[文档](./docs/build/index.md)自行构建

## 更多

- [完整配置说明](./docs/config/index.md)
- [PWA 使用教程](./docs//pwa_usage/index.md)
- [更新版本](./docs/migration/index.md)
- [常见问题](./docs/qa/index.md)

## 开源协议

[GPL](./license)
