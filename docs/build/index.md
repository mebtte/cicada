# 自行构建特定平台二进制包

## 准备

- Node.js >= 16

## 构建

安装依赖:

```sh
npm install
```

在 [package.json](../package.json) 中 `pkg` 添加 `targets` 字段, 以 Apple silicon macOS 为例, 其中 `node16` 是固定值, 操作系统是 `macOS`, CPU 架构是 `arm64`, 所以 `target` 是 `node16-macos-arm64`, 将值填入 `targets` 中:

```json
{
  "pkg": {
    "assets": ["pwa/**/*", "node_modules/**/*.node"],
    "outputPath": "build",
    "targets": ["node16-macos-arm64"]
  }
}
```

其他 `target` 可以参考 `pkg` [文档](https://github.com/vercel/pkg#targets).

执行命令 `npm run build:current`, 构建后的包位于 `build` 目录下.

注意, 由于 `pkg` 和 `sqlite3` 的限制, 构建后的二进制包只能在当前平台(同样的操作系统和 CPU 架构)运行, 且无法为其他平台构建, 比如无法为其他操作系统构建, 也无法为其他 CPU 架构构建.
