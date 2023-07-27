# Configuration

Configuration file can be JSON or [JSON5](https://json5.org) format.

## data

- type: `string`
- optional
- default: `{{pwd}}/cicada`

Data directory path.

## port

- type: `number`
- optional
- default: `8000`

The port of serving.

## emailHost

- type: `string`
- required

Host of email service.

## emailPort

- type: `number`
- optional
- default: `465`

Port of email service

## emailUser

- type: `string`
- required

User of email service.

## emailPass

- type: `string`
- required

Password of email service.

## firstUserEmail

- type: `string`
- optional

On first run, cicada will create first user using `firstUserEmail` and you can login with it. It will be ignored after initializing. If you don't specify, CLI will ask you input and docker will exit, so you must configure it when using docker.

## mode

- type: `enum`
- optional
- default: `production`

Serving mode, value can be `production` or `development`. This property only work for developing, don't use it on production.
