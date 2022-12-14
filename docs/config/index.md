# 配置项

## data

- optional
- default: `{{pwd}}/cicada`

存放数据的目录.

## port

- optional
- default: `8000`

提供服务的端口.

## emailHost

- required

邮件服务器主机.

## emailPort

- optional
- default: `465`

邮件服务器端口.

## emailUser

- required

邮件服务器用户.

## emailPass

- required

邮件服务器用户密码.

## initialAdminEmail

- optional

初始管理员邮箱, 用于创建管理员账号, 如果未设置, 将会在首次运行服务时要求在 CLI 输入.
如果已创建管理员账号则忽略该配置项.

## mode

- optional
- default: `production`

运行模式, `development` 表示开发模式, `production` 表示生产模式.
该配置项主要用于开发, 普通用户无需关注.
