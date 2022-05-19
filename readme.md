# 知了

知了, 一个自托管的音乐服务.

知了服务包含多个子应用:

| 应用            | 描述                                                        | 状态        |
| --------------- | ----------------------------------------------------------- | ----------- |
| server          | 服务端, 提供 API 服务和静态资源服务                         | `开发中...` |
| pwa             | 用户端, 提供浏览器应用, 支持桌面/移动端浏览器               | `开发中...` |
| desktop         | 用户端, 提供桌面客户端, 支持 Windows/macOS, 界面由 pwa 提供 | `开发中...` |
| desktop_setting | 用户端, 提供桌面客户端设置界面                              | `开发中...` |
| mobile          | 用户端, 提供移动设备客户端, 支持 Android/iOS                | `规划中...` |

## 环境要求

- Node.js >= 16 && npm >= 8

## 配置

知了配置文件位于根目录下的 `config.json`, 可用配置如下:

| 字段               | 类型   | 是否必须 | 默认值                          | 描述                                                                 |
| ------------------ | ------ | -------- | ------------------------------- | -------------------------------------------------------------------- |
| serverPort         | number | 否       | 8000                            | server 提供服务的端口                                                |
| serverAddress      | string | 否       | http://localhost:{{serverPort}} | server **实际**部署地址, 比如通过 https://cicada.mebtte.com 暴露服务 |
| serverClusterCount | number | 否       | {{os.cups().length}}            | server 进程数量                                                      |
| serverBase         | string | 否       | {{os.homedir()}}/.cicada        | server 数据存放目录                                                  |
|                    |        |          |                                 |                                                                      |
| pwaDevPort         | number | 否       | 8001                            | pwa 开发使用端口                                                     |

## 构建/部署

```sh
npm run build
cd build
node index.js
```

## 开发

知了多个子应用在开发环境下相互独立, 需要采用不同的开发方式.

### server

代码位于 `apps/server` 下, 通过 `npm run dev:server` 启动服务.

### pwa

代码位于 `apps/pwa` 下, 通过 `npm run dev:pwa` 启动服务.

## 开源协议

[GPL](./license)
