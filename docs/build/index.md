# 构建当前平台二进制包

## 准备

- [Node.js](https://nodejs.org) >= 16

## 构建

拉取项目:

```sh
git clone https://github.com/mebtte/cicada.git
```

进入项目目录:
```sh
cd cicada
```

安装相关依赖:

```sh
npm install
# npm 是 node.js 包管理器, 附在 node.js 已一起安装
```

构建:

```sh
npm run build:current
```
> 构建过程中需要下载对应的资源包, 在代理情况下可以提高下载速度

构建成功后二进制包位于项目的 `build` 目录下, 一般情况下会有多个操作系统的包, 其中当前系统的包才是可运行的.
以 Apple silicon macOS 为例, 构建后会生成 `linux`/`win`/`macos` 三个包, 其中 `macos` 的包才是可运行的.

![](./build.png)

