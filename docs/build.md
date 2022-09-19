# 自行构建特定平台二进制包

## 准备

- Node.js >= 16

## 构建

安装依赖:

```sh
npm install
```

在 `package.json` 中 `pkg` 添加 `targets` 字段, 写入当前平台, 以 Apple silicon macOS 为例:

```json
{
  "pkg": {
    "assets": ["pwa/**/*", "node_modules/**/*.node"],
    "outputPath": "build",
    "targets": ["node16-macos-arm64"]
  }
}
```

`targets` 字段可以参考 `pkg` [文档](https://github.com/vercel/pkg#targets).

构建:

```sh
npm run build:current
```

构建后的包位于 `build` 目录下.

注意, 由于 `pkg` 和 `sqlite3` 的限制, 构建后的二进制包只能在当前平台(同样的操作系统和 CPU 架构)运行, 且无法为其他平台构建, 比如无法为其他操作系统构建, 也无法为其他 CPU 架构构建.
