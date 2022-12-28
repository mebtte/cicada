# 配置项

配置文件支持 JSON 或 [JSON5](https://json5.org) 格式.

## data

- type: `string`
- optional
- default: `{{pwd}}/cicada`

存放数据的目录.

## port

- type: `number`
- optional
- default: `8000`

提供服务的端口.

## emailHost

- type: `string`
- required

邮件服务器主机.

## emailPort

- type: `number`
- optional
- default: `465`

邮件服务器端口.

## emailUser

- type: `string`
- required

邮件服务器用户.

## emailPass

- type: `string`
- required

邮件服务器用户密码.

## initialAdminEmail

- type: `string`
- optional

初始管理员邮箱, 用于创建管理员账号, 如果未设置, 将会在首次运行服务时要求在 CLI 输入.
**注意, 已完成初始化后该配置项不再生效!**

## mode

- type: `enum`
- optional
- default: `production`

运行模式, `production` 表示生产模式, `development` 表示开发模式.
该配置项主要用于开发, 普通用户无需关注, 设置成 `development` 可能会导致知了无法正常工作.
