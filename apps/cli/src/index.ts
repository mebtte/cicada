import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import exitWithMessage from './utils/exit_with_message';
import definition from './definition';
import startServer from './commands/start_server';
import importMusic from './commands/import_music';
import upgradeData from './commands/upgrade_data';
import fixData from './commands/fix_data';
import { FIRST_USER_ID } from './constants';
import { DEFAULT_CONFIG, Mode } from './config';

const program = new Command()
  .name('cicada')
  .description('A multi-user music service for self-hosting')
  .version(definition.VERSION);

/**
 * 启动服务
 * @author mebtte<hi@mebtte.com>
 */
program
  .command('start')
  .description('start cicada server')
  .option('--mode [mode]', 'development or production')
  .option('--data [data]', 'data directory location')
  .option('--port [port]', 'port of http server')
  .action(
    async ({
      mode,
      data,
      port,
    }: {
      mode?: Mode;
      data?: string;
      port?: string;
    }) => {
      if (mode && !Object.values(Mode).includes(mode)) {
        return exitWithMessage(`[ ${mode} ] is not a valid mode`);
      }

      const absoluteData = data
        ? path.isAbsolute(data)
          ? data
          : path.resolve(process.cwd(), data)
        : DEFAULT_CONFIG.data;
      return startServer({
        mode: mode || DEFAULT_CONFIG.mode,
        data: absoluteData,
        port: port ? Number(port) : DEFAULT_CONFIG.port,
      });
    },
  );

/**
 * 数据升级
 * @author mebtte<hi@mebtte.com>
 */
program
  .command('upgrade data')
  .description('upgrade data from v1 to v2')
  .argument('<data>', 'data directory')
  .action((data: string) => {
    const absoluteData = path.isAbsolute(data)
      ? data
      : path.resolve(process.cwd(), data);
    if (!fs.existsSync(absoluteData)) {
      return exitWithMessage(`[ ${absoluteData} ] not exist`);
    }
    return upgradeData({ data: absoluteData });
  });

/**
 * 数据修复
 * @author mebtte<hi@mebtte.com>
 */
program
  .command('fix-data')
  .description('fix data')
  .argument('<data>', 'cicada data directory')
  .action((data: string) => {
    const absoluteData = path.isAbsolute(data)
      ? data
      : path.resolve(process.cwd(), data);
    if (!fs.existsSync(absoluteData)) {
      return exitWithMessage(`[ ${absoluteData} ] not exist`);
    }
    return fixData({ data: absoluteData });
  });

/**
 * 导入音乐
 * @author mebtte<hi@mebtte.com>
 */
program
  .command('import')
  .description('import music(s) to cicada')
  .option('--data <data>', 'cicada data directory')
  .option('--uid <uid>', "specify music creator's id", FIRST_USER_ID)
  .option('-r, --recursive', 'scan sub directories recursively', false)
  .option('--skip-existence-check', 'skip existence check', false)
  .argument('<source>', 'source directory or file')
  .action(
    (
      source: string,
      options: {
        data?: string;
        uid: string;
        r: boolean;
        recursive: boolean;
        skipExistenceCheck: boolean;
      },
    ) => {
      const absoluteSource = path.isAbsolute(source)
        ? source
        : path.resolve(process.cwd(), source);
      if (!fs.existsSync(absoluteSource)) {
        return exitWithMessage(`[ ${absoluteSource} ] not exist`);
      }

      if (!options.data) {
        return exitWithMessage('Using [ --data ] to set data directory');
      }
      const absoluteData = path.isAbsolute(options.data)
        ? options.data
        : path.resolve(process.cwd(), options.data);
      if (!fs.existsSync(absoluteData)) {
        return exitWithMessage(`[ ${absoluteData} ] not exist`);
      }

      return importMusic({
        source: absoluteSource,
        data: absoluteData,
        uid: options.uid,
        recursive: options.r || options.recursive,
        skipExistenceCheck: options.skipExistenceCheck,
      });
    },
  );

program.parse();
