import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import server from './server';
import exitWithMessage from './utils/exit_with_message';
import definition from './definition';
import importMusic from './commands/import_music';

const program = new Command()
  .name('cicada')
  .description('知了, 支持多用户的开源音乐服务.')
  .version(definition.VERSION);

/**
 * 启动服务
 * @author mebtte<hi@mebtte.com>
 */
program
  .command('start')
  .description('start cicada server')
  .option('-c, --config <config>', 'specify config file')
  .option('--data <data>', "override config's data")
  .option('--port <port>', "override config's port")
  .action(
    async ({
      config,
      data,
      port,
    }: {
      config?: string;
      data?: string;
      port?: string;
    }) => {
      if (!config) {
        return exitWithMessage('请通过 [ -c/--config ] 指定配置文件');
      }

      const portNumber = port ? Number(port) : undefined;
      return server.start({
        configFilePath: path.isAbsolute(config)
          ? config
          : path.resolve(process.cwd(), config),
        data,
        port: portNumber,
      });
    },
  );

/**
 * 导入音乐
 * @author mebtte<hi@mebtte.com>
 */
program
  .command('import')
  .description('import music(s) to cicada')
  .option('--data <data>', 'cicada data directory')
  .option('--uid <user_id>', "specify music creator's id", '1')
  .option('-r, --recursive', 'import music from sub directories', false)
  .option('--skip-check-exist', 'scan sub directories', false)
  .argument('[source]', 'source directory or file')
  .action(
    (
      source: string,
      options: {
        data?: string;
        uid: string;
        r: boolean;
        recursive: boolean;
        skipCheckExist: boolean;
      },
    ) => {
      if (!source) {
        return exitWithMessage('请指定源数据');
      }
      const absoluteSource = path.isAbsolute(source)
        ? source
        : path.resolve(process.cwd(), source);
      if (!fs.existsSync(absoluteSource)) {
        return exitWithMessage(`源数据 [ ${absoluteSource} ] 不存在`);
      }

      if (!options.data) {
        return exitWithMessage('请通过 [ --data ] 指定数据目录');
      }
      const absoluteData = path.isAbsolute(options.data)
        ? options.data
        : path.resolve(process.cwd(), options.data);
      if (!fs.existsSync(absoluteData)) {
        return exitWithMessage(`数据目录 [ ${absoluteData} ] 不存在`);
      }

      return importMusic({
        source: absoluteSource,
        data: absoluteData,
        uid: options.uid,
        recursive: options.r || options.recursive,
        skipCheckExist: options.skipCheckExist,
      });
    },
  );

program.parse();
