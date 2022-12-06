import { Command } from 'commander';
import env from './env';

const program = new Command()
  .name('cicada')
  .description('知了, 一个支持多用户的自主托管音乐服务')
  .version(env.VERSION || '');

program
  .command('start')
  .description('启动知了服务')
  .option('-c, --config <config>', '配置文件')
  .action(({ config }) => {
    if (!config) {
    }
  });

program.parse();
