import { Command } from 'commander';
import { Config } from './config';
import env from './env';
import server from './server';

function parseConfig(configPath?: string): Partial<Config> {
  return {};
}

const program = new Command()
  .name('cicada')
  .description('知了, 一个支持多用户的自主托管音乐服务')
  .version(env.VERSION || '');

program
  .command('start')
  .description('start cicada server')
  .option('-c, --config <config>', 'specify config file')
  .action(async ({ config: configPath }: { config?: string }) => {
    const configJSON = parseConfig(configPath);
    server.start(configJSON);
  });

program.parse();
