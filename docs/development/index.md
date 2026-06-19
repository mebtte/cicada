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

## Application Versioning

CLI, PWA, and Apple clients use the same application version format.

The base version must come from a Git tag in `MAJOR.MINOR.PATCH` form, for
example `3.5.0`. If a build has extra meaning, append `-{description}` to the
base version.

Current build scenarios:

| Scenario | Format | Example |
| -------- | ------ | ------- |
| Release build | `{tag}` | `3.5.0` |
| Local development | `{tag}-local` | `3.5.0-local` |
| Docker beta v3 | `{tag}-beta.{YYMMDDHHmm}` | `3.5.0-beta.2606181430` |

When comparing application versions, strip the first `-{description}` suffix
before comparing. For example, `3.5.0-local` and `3.5.0-beta.2606181430` both
compare as `3.5.0`.

Builds must fail when an application version does not match the format above.
This includes explicit overrides such as `CICADA_VERSION` or Makefile
`VERSION`.

This rule is only for the Cicada application version. It does not apply to
dependency versions, OpenAPI versions, data migration versions, cache keys, or
Docker major tags such as `v3`.

Apple builds keep `CFBundleShortVersionString` as the base version for platform
compatibility. The full Cicada application version is stored in `CicadaVersion`
and is the value used when talking to the server.

## Rules

- Variables prefer lower-camel case

---

If you have other questions, you can make a [issue](https://github.com/mebtte/cicada/issues).
