# CLI

Currently, `cicada` can be run on:

- AMD64
  - Linux
  - Windows
- ARM64
  - Linux
  - macOS
  - Windows

## Requirement

- Go environment
- Node.js environment

## Debug command

```sh
cd apps/cli
go run . --help
```

## Start DEV Server

In development, `cicada` uses [air](https://github.com/air-verse/air) to start dev server. First, you need to install it.

```sh
go install github.com/air-verse/air@latest
```

Use the follow command to start dev server:

```sh
CICADA_DATA=/path_to/data air
```

`/path_to/data` means the directory of the data, you should replace to yours. And the server can be visited on `http://localhost:8000`.

## API Reference

After starting dev server, the API reference can be visited on `http://localhost:8000/api_reference`.
