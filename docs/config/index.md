配置文件使用 json, 支持以下配置:

| 参数                              | 类型   | 是否必须 | 默认值             | 描述                                         |
| --------------------------------- | ------ | -------- | ------------------ | -------------------------------------------- |
| emailHost                         | string | 是       | -                  | 发信邮箱域名                                 |
| emailPort                         | number | 否       | 465                | 发信邮箱端口                                 |
| emailUser                         | string | 是       | -                  | 发信邮箱账号                                 |
| eamilPass                         | string | 是       | -                  | 发信邮箱密码                                 |
| port                              | number | 否       | 8000               | 提供服务的端口                               |
| base                              | string | 否       | {{homedir}}/cicada | 数据存放目录                                 |
| userMusicbillMaxAmount            | number | 否       | 100                | 每个用户最大乐单数量                         |
| userExportMusicbillMaxTimesPerDay | number | 否       | 3                  | 每个用户每天导出乐单最大次数                 |
| userCreateMusicMaxTimesPerDay     | number | 否       | 5                  | 每个用户每天创建音乐最大次数                 |
| initialAdminEmail                 | string | 否       |                    | 初始管理员邮箱, 如果已有管理员则忽略改配置项 |
