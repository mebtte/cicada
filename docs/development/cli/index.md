# CLI

## Requirement

- [Go](https://go.dev) environment

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