# 知了

知了, 一个自托管的音乐服务. 知了服务包含多个子应用:

| 应用            | 描述                                                        | 状态        |
| --------------- | ----------------------------------------------------------- | ----------- |
| server          | 服务端, 提供 API 服务和静态资源服务                         | `开发中...` |
| pwa             | 用户端, 提供浏览器应用, 支持桌面/移动端浏览器               | `开发中...` |
| desktop         | 用户端, 提供桌面客户端, 支持 Windows/macOS, 界面由 pwa 提供 | `开发中...` |
| desktop_setting | 用户端, 提供桌面客户端设置界面                              | `开发中...` |
| mobile          | 用户端, 提供移动设备客户端, 支持 Android/iOS                | `规划中...` |

## 服务运行要求

- Node.js >= 16 && npm >= 8
- 用于发信的邮箱账号

## 构建并部署

```sh
npm i
npm run build
node build/index.js --emailHost=email.com --emailUser=mebtte@email.com --emailPass=secret
```

知了支持使用参数进行配置:

| 参数          | 类型   | 是否必须 | 默认值                          | 描述                                                         |
| ------------- | ------ | -------- | ------------------------------- | ------------------------------------------------------------ |
| emailHost     | string | 是       | -                               | 发信邮箱域名                                                 |
| emailPort     | number | 否       | 465                             | 发信邮箱端口                                                 |
| emailUser     | string | 是       | -                               | 发信邮箱账号                                                 |
| eamilPass     | string | 是       | -                               | 发信邮箱密码                                                 |
| ---           | ---    | ---      | ---                             | ---                                                          |
| port          | number | 否       | 8000                            | 提供服务的端口                                               |
| publicAddress | string | 否       | http://localhost:{{serverPort}} | **实际**暴露服务的地址, 比如通过 https://cicada.com 暴露服务 |
| clusterCount  | number | 否       | {{os.cups().length}}            | 服务进程数量                                                 |
| base          | string | 否       | {{os.homedir()}}/.cicada        | 数据存放目录                                                 |

## 开源协议

[GPL](./license)
