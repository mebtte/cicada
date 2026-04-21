# CLI

## Requirement

- [Go](https://go.dev) environment

## Data structure

All of `cicada` data is under a directory, here is its structure:

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

Cicada use SQLite as database.

The SQLite schema diagram is maintained in [database.d2](./database.d2) which powered by [d2](https://d2lang.com).

Render the diagram locally with:

```bash
d2 docs/development/database.d2 local_dir/database.svg
```

## Start DEV Server

In development, `cicada` uses [air](https://github.com/air-verse/air) to start dev server. First, you need to install it.

```sh
cd apps/cli
go install github.com/air-verse/air@latest
```

Then you need to add go bin to `PATH`:

```sh
export PATH=$PATH:$(go env GOPATH)/bin
```

Use the follow command to start dev server:

```sh
CICADA_DATA=/path_to/data air
```

`/path_to/data` means the directory of the data, you should replace to yours.

> attention: you should run `air` under the `apps/cli`

And the server will listen on `:8000`.

## API Reference

After starting dev server, the API reference can be visited on `http://localhost:8000/api_reference`.

## Rules

- Alter database must also update [database.d2](./database.d2)