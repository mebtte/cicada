import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import exitWithMessage from './utils/exit_with_message';
import definition from './definition';
import startServer from './commands/start_server';
import importMusic from './commands/import_music';
import dataUpgrade from './commands/data_upgrade';
import dataFix from './commands/data_fix';
import { FIRST_USER_ID } from './constants';

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
  .option('-c, --config <config>', 'specify config file')
  .action(async ({ config }: { config?: string }) => {
    if (!config) {
      return exitWithMessage('Using [ -c/--config ] to specify config file');
    }
    return startServer({
      configFilePath: path.isAbsolute(config)
        ? config
        : path.resolve(process.cwd(), config),
    });
  });

/**
 * 数据升级
 * @author mebtte<hi@mebtte.com>
 */
program
  .command('data-upgrade')
  .description('upgrade data from v0 to v1')
  .argument('<data>', 'cicada data directory')
  .action((data: string) => {
    const absoluteData = path.isAbsolute(data)
      ? data
      : path.resolve(process.cwd(), data);
    if (!fs.existsSync(absoluteData)) {
      return exitWithMessage(`[ ${absoluteData} ] not exist`);
    }
    return dataUpgrade({ data: absoluteData });
  });

/**
 * 数据修复
 * @author mebtte<hi@mebtte.com>
 */
program
  .command('data-fix')
  .description('fix data')
  .argument('<data>', 'cicada data directory')
  .action((data: string) => {
    const absoluteData = path.isAbsolute(data)
      ? data
      : path.resolve(process.cwd(), data);
    if (!fs.existsSync(absoluteData)) {
      return exitWithMessage(`[ ${absoluteData} ] not exist`);
    }
    return dataFix({ data: absoluteData });
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
