# Run by source code

## Requirements

- [Node>=18](https://nodejs.org)

## Deployment

```sh
git clone https://github.com/mebtte/cicada.git
cd cicada
npm ci
npm run build:pwa
npm start -- -- start --port <port> --data <data> # attention: double --
```

When needing upgrade, you should run below commands:

```sh
git pull # pull the latest code
npm run build:pwa # rebuild pwa
npm start -- -- start --port <port> --data <data> # restart the server
```

## Migration

```sh
git fetch -p
git switch v2
npm ci
npm start -- -- upgrade-data <data>
```

## Music import

```sh
# import directory
npm start -- -- import --data /path_to/cicada_data --recursive <music_directory>

# import file
npm start -- -- import --data /path_to/cicada_data <music>
```

## Data fix

```sh
npm start -- -- fix-data <data>
```
