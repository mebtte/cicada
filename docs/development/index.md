# Development

Cicada is monorepo which has multiple apps:

- apps/cli: CLI tool for serving data and managing data, powered by `go`. See the [development docs](./cli/index.md).
- apps/pwa: Client for browser, powered by `react`/`typescript`. See the [development docs](./pwa/index.md).

## Nouns

| English   | Chinese  | Remark                                                       |
| --------- | -------- | ------------------------------------------------------------ |
| Musicbill | 乐单     | A collection of musics                                       |
| Playqueue | 播放队列 | A queue for playing musics, it has sequence                  |
| Playlist  | 播放列表 | A collection for playing musics, each music inside is unique |

## Rules

- Variabls prefer lower-camel case
