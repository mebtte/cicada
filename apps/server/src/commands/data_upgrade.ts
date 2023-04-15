import inquirer from 'inquirer';
import {
  getAssetDirectory,
  getDataVersionPath,
  getConfig,
  updateConfig,
} from '@/config';
import { createSpinner } from 'nanospinner';
import fs from 'fs';
import exitWithMessage from '@/utils/exit_with_message';
import { DATA_VERSION } from '../constants';

async function upgradeAsset() {}

async function upgradeDB() {}

export default async ({ data }: { data: string }) => {
  updateConfig({ data });

  const dataVersion = Number(
    fs.readFileSync(getDataVersionPath()).toString().replace(/\s/gm, ''),
  );
  if (dataVersion !== DATA_VERSION - 1) {
    return exitWithMessage(
      `当前数据版本为 v${dataVersion}, 请先使用 v${
        dataVersion + 1
      } 版本的知了将数据升级到 v${dataVersion + 1}`,
    );
  }

  const answer: { confirmed: boolean } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: '升级数据将会对数据目录进行修改, 建议先备份数据, 是否继续?',
      default: false,
    },
  ]);
  if (!answer.confirmed) {
    return;
  }

  const spinner = createSpinner('数据正在从 v0 升级到 v1');
  spinner.start();
  await Promise.all([upgradeAsset(), upgradeDB()]);
  spinner.success({ text: '数据已从 v0 升级到 v1' });
};
