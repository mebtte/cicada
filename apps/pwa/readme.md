# PWA

## Requirement

- [Node.js](https://nodejs.org) environment

## Start DEV Server

```sh
npm install
npm run dev
```

And the `pwa` can be visited on `http://localhost:8001`.

## Subpath Deployment

The production build uses relative asset URLs, so the same build supports both
the domain root and a subpath:

```sh
cicada start --base-path /cicada
```

Open `https://example.com/cicada/`. Hash routes stay below this entry, for example
`/cicada/#/login`. The manifest, icons and service worker use the same app base
URL; caches and IndexedDB are isolated by the app's mount path.

The server address field accepts the complete service base URL, including its
subpath. It can differ from the PWA's own address. Server base URLs are stored
without a trailing slash, and API paths and returned `/asset/...` paths are
resolved against that service base. The new storage namespace starts with
fresh local settings and accounts; old frontend data is not migrated.

## Components Docs

`cicada` has own components. Visit its docs on `http://localhost:6006` by running:

```sh
npm run storybook
```
