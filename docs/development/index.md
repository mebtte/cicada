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

## Data structure

```
|- assets
  |- music
  |- musicbill_cover
  |- music_cover
  |- singer_avatar
  |- user_avatar
|- cache
|- logs
|- trash # save removed data temporarily
|- v # its content indicates version of data
|- db # the database of sqlite
|- jwt_secret # its content is secret of jwt
```

## Database structure

The SQLite schema diagram is maintained in [database.d2](./database.d2) which powered by [d2](https://d2lang.com).

Render the diagram locally with:

```bash
d2 docs/development/database.d2 local_dir/database.svg
```

## Rules

- Alter database must also update `database.d2`
