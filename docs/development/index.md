# Development

Cicada is monorepo which has multiple apps:

- apps/cli: CLI tool for serving data and managing data, powered by `go`. See the [development docs](../../apps/cli/readme.md).
- apps/pwa: Client for browser, powered by `react`/`typescript`. See the [development docs](../../apps/pwa/readme.md).
- apps/apple: Client for iOS/iPadOS/macOS, powered by `swift`. See the [development docs](../../apps/apple/readme.md).

## Nouns

| English   | Chinese  | Remark                                                       |
| --------- | -------- | ------------------------------------------------------------ |
| Musicbill | 乐单     | A collection of musics                                       |
| Playqueue | 播放队列 | A queue for playing musics, it has sequence                  |
| Playlist  | 播放列表 | A collection for playing musics, each music inside is unique |

## Rules

- Variabls prefer lower-camel case
- Uses [semver](https://semver.org) as version norm

---

If you have other questions, you can make a [issue](https://github.com/mebtte/cicada/issues).