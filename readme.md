# 知了

知了, 一个自主托管的音乐服务.

> ⚠️ 项目正在开发中, 部分功能可能会产生破坏性的修改.

## 子应用

| 应用    | 描述                                             | 状态        |
| ------- | ------------------------------------------------ | ----------- |
| server  | 服务端, 提供 API 服务和静态资源服务              | `开发中...` |
| pwa     | 用户端, 提供浏览器应用, 支持桌面/移动端浏览器    | `开发中...` |
| desktop | 用户端, 提供桌面客户端, 支持 Windows/macOS/Linux | `规划中...` |
| mobile  | 用户端, 提供移动设备客户端, 支持 Android/iOS     | `规划中...` |

## 准备

- 可发送邮件的邮箱账号

## 部署

在 [Releases](https://github.com/mebtte/cicada/releases) 下载并解压对应平台的二进制包, 通过下面命令启动(以 Apple silicon macOS 为例):

```sh
./cicada-macos-arm64 --config config.json
```

> 目前只提供了几种主流平台的构建包, 其他平台可以参考[文档](./docs/build.md)自行构建

配置文件使用 json, 支持以下配置:

| 参数                              | 类型   | 是否必须 | 默认值                          | 描述                                                                               |
| --------------------------------- | ------ | -------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| emailHost                         | string | 是       | -                               | 发信邮箱域名                                                                       |
| emailPort                         | number | 否       | 465                             | 发信邮箱端口                                                                       |
| emailUser                         | string | 是       | -                               | 发信邮箱账号                                                                       |
| eamilPass                         | string | 是       | -                               | 发信邮箱密码                                                                       |
| port                              | number | 否       | 8000                            | 提供服务的端口                                                                     |
| publicAddress                     | string | 否       | http://localhost:{{serverPort}} | **实际**暴露服务的地址, 比如 nginx 反向代理通过 https://cicada.mebtte.com 暴露服务 |
| clusterCount                      | number | 否       | {{os.cups().length}}            | 服务进程数量                                                                       |
| base                              | string | 否       | {{homedir}}/cicada              | 数据存放目录                                                                       |
| userExportMusicbillMaxTimesPerDay | number | 否       | 3                               | 用户每天导出乐单最大次数                                                           |
| userUploadMusicMaxTimesPerDay     | number | 否       | 5                               | 用户每天上传音乐最大次数                                                           |

## 常见问题

<details>
  <summary>如何迁移数据 ?</summary>

知了所有数据都位于 `{{base}}` 目录下, 将 `{{base}}` 目录复制或者移动即可完成迁移.

</details>

<details>
  <summary>为什么初始超级账号昵称是 `pangu` ?</summary>

`pangu` === `盘古`.

</details>

## 其他

### 数据库

知了使用 `sqlite3` 作为数据库, 路径为 `${base}/db`. 通常情况下主版本发生变化的同时数据库定义也会跟着变化, 当升级知了到最新版本时需要手动对数据库进行调整, 具体调整可以参考[数据库变更记录](./docs/db.md).

## 开源协议

[GPL](./license)
