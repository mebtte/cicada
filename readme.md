# 知了

知了, 一个自托管的音乐服务. 知了服务包含多个子应用:

| 应用            | 描述                                                        | 状态        |
| --------------- | ----------------------------------------------------------- | ----------- |
| server          | 服务端, 提供 API 服务和静态资源服务                         | `开发中...` |
| pwa             | 用户端, 提供浏览器应用, 支持桌面/移动端浏览器               | `开发中...` |
| desktop         | 用户端, 提供桌面客户端, 支持 Windows/macOS, 界面由 pwa 提供 | `开发中...` |
| desktop_setting | 用户端, 提供桌面客户端设置界面                              | `开发中...` |
| mobile          | 用户端, 提供移动设备客户端, 支持 Android/iOS                | `规划中...` |

> ⚠️ 项目正在开发中, 部分功能可能会产生破坏性的修改.

## 服务运行要求

- [Node.js](https://nodejs.org) >= 16
- 邮箱账号(可发送邮件)

## 部署

```sh
git clone https://github.com/mebtte/cicada.git
cd cicada
npm install --verbose
# start 后面的 -- 不能省略
npm start -- --emailHost=email.com --emailUser=mebtte@email.com --emailPass=secret
```

知了支持使用参数进行配置:

| 参数                              | 类型   | 是否必须 | 默认值                          | 描述                                                                |
| --------------------------------- | ------ | -------- | ------------------------------- | ------------------------------------------------------------------- |
| emailHost                         | string | 是       | -                               | 发信邮箱域名                                                        |
| emailPort                         | number | 否       | 465                             | 发信邮箱端口                                                        |
| emailUser                         | string | 是       | -                               | 发信邮箱账号                                                        |
| eamilPass                         | string | 是       | -                               | 发信邮箱密码                                                        |
| port                              | number | 否       | 8000                            | 提供服务的端口                                                      |
| publicAddress                     | string | 否       | http://localhost:{{serverPort}} | **实际**暴露服务的地址, 比如通过 https://cicada.mebtte.com 暴露服务 |
| clusterCount                      | number | 否       | {{os.cups().length}}            | 服务进程数量                                                        |
| base                              | string | 否       | {{project}}/resources           | 数据存放目录                                                        |
| initialSuperUserEmail             | string | 否       | -                               | 初始超级账号邮箱, 如果未指定, 将在首次运行提示输入                  |
| userExportMusicbillMaxTimesPerDay | number | 否       | 5                               | 用户每天导出乐单最大次数                                            |

除 CLI 参数外, 配置还支持文件方式, 在根目录创建 `argv.json`, 将同名配置写入文件中. 如果 CLI 参数和配置文件同时存在, 则按照 `CLI` > `argv.json` > `default` 的优先级.

`npm start` 仅会启动 `server`, 执行 `npm run build:pwa` 后 `server` 会托管 `pwa` 静态资源.

## 常见问题

<details>
  <summary>如何迁移数据 ?</summary>

知了所有数据都位于 `base` 目录下, 将 `base` 目录复制或者移动即可完成迁移.

</details>

<details>
  <summary>为什么初始超级账号昵称是 `pangu` ?</summary>

`pangu` === `盘古`.

</details>

## 其他

- [数据库变更记录](./db_changelog.md)

## 开源协议

[GPL](./license)
