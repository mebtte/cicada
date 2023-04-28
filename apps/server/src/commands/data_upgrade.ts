import inquirer from 'inquirer';
import { getAssetDirectory, getDataVersionPath, updateConfig } from '@/config';
import { createSpinner, Spinner } from 'nanospinner';
import fs from 'fs';
import fsPromises from 'fs/promises';
import exitWithMessage from '@/utils/exit_with_message';
import { AssetType } from '#/constants';
import { getDB } from '@/db';
import generateRandomString from '#/utils/generate_random_string';
import { ID_LENGTH, MusicType } from '#/constants/music';

async function combineMusicAsset() {
  const musicSqDirectory = `${getAssetDirectory()}/music_sq`;

  const musicAcDirectory = `${getAssetDirectory()}/music_ac`;
  const acs = await fsPromises.readdir(musicAcDirectory);
  for (const ac of acs) {
    await fsPromises.cp(
      `${musicAcDirectory}/${ac}`,
      `${musicSqDirectory}/${ac}`,
      { force: true },
    );
  }

  const musicHqDirectory = `${getAssetDirectory()}/music_hq`;
  const hqs = await fsPromises.readdir(musicHqDirectory);
  for (const hq of hqs) {
    await fsPromises.cp(
      `${musicHqDirectory}/${hq}`,
      `${musicSqDirectory}/${hq}`,
      { force: true },
    );
  }

  await Promise.all([
    fsPromises.rename(musicSqDirectory, getAssetDirectory(AssetType.MUSIC)),
    fsPromises.rm(musicAcDirectory, { force: true, recursive: true }),
    fsPromises.rm(musicHqDirectory, { force: true, recursive: true }),
  ]);
}

async function separateMusicAc() {
  const acMusicList = await getDB().all<{
    id: string;
    type: MusicType;
    name: string;
    ac: string;
    createUserId: string;
    createTimestamp: number;
    aliases: string;
    cover: string;
  }>(
    `
      SELECT
        *
      FROM music
      WHERE ac != ''
    `,
    [],
  );

  for (const acMusic of acMusicList) {
    const singers = await getDB().all<{ singerId: string }>(
      `
        SELECT
          singerId
        FROM music_singer_relation
        WHERE musicId = ?
      `,
      [acMusic.id],
    );
    const id = generateRandomString(ID_LENGTH, false);
    await getDB().run(
      `
        INSERT INTO music( id, type, name, sq, createUserId, createTimestamp, aliases, cover )
        VALUES( ?, ?, ?, ?, ?, ?, ?, ? )
        `,
      [
        id,
        acMusic.type,
        `${acMusic.name}[伴奏]`,
        acMusic.ac,
        acMusic.createUserId,
        acMusic.createTimestamp,
        acMusic.aliases,
        acMusic.cover,
      ],
    );
    await getDB().run(
      `
        INSERT INTO music_singer_relation( musicId, singerId )
        VALUES ${singers.map(() => '( ?, ? )').join(', ')}
      `,
      singers.map((singerId) => [id, singerId]).flat(Infinity),
    );
  }
}

async function migrateHqToSq() {
  const hqMusicList = await getDB().all<{
    id: string;
    hq: string;
  }>(
    `
      SELECT
        id,
        hq
      FROM music
      WHERE hq != ''
    `,
    [],
  );
  for (const hqMusic of hqMusicList) {
    await getDB().run(
      `
        UPDATE music SET sq = ?
        WHERE id = ?
      `,
      [hqMusic.hq, hqMusic.id],
    );
  }
}

async function dropAcAndHq() {
  await Promise.all([
    getDB().run(
      `
        ALTER TABLE music DROP COLUMN ac;
      `,
    ),
    getDB().run(
      `
        ALTER TABLE music DROP COLUMN hq;
      `,
    ),
  ]);
}

async function renameSq() {
  await getDB().run(
    `
      ALTER TABLE music RENAME COLUMN sq TO asset;
    `,
  );
}

async function writeNewVersion() {
  await fsPromises.writeFile(getDataVersionPath(), '1');
}

export default async ({ data }: { data: string }) => {
  updateConfig({ data });

  if (!fs.existsSync(getDataVersionPath())) {
    return exitWithMessage(`[ ${data} ] 不是合法的数据目录`);
  }
  const dataVersion = Number(
    fs.readFileSync(getDataVersionPath()).toString().replace(/\s/gm, ''),
  );
  if (dataVersion !== 0) {
    return exitWithMessage('当前版本的知了只支持升级 v0 版本的数据');
  }

  const answer: { confirmed: boolean } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message:
        '升级数据将会对数据目录进行修改, 升级过程中断将会导致数据异常, 请先备份数据, 是否继续?',
      default: false,
    },
  ]);
  if (!answer.confirmed) {
    return;
  }

  let spinner: Spinner;

  spinner = createSpinner();
  spinner.start({ text: '正在合并音乐资源...' });
  await combineMusicAsset();
  spinner.success({ text: '音乐资源已合并' });

  spinner = createSpinner();
  spinner.start({ text: '正在分离伴奏...' });
  await separateMusicAc();
  spinner.success({ text: '伴奏已分离' });

  spinner = createSpinner();
  spinner.start({ text: '正在迁移无损音质到标准音质...' });
  await migrateHqToSq();
  spinner.success({ text: '无损音质已迁移到标准音质' });

  spinner = createSpinner();
  spinner.start({ text: '正在删除 ac 和 hq...' });
  await dropAcAndHq();
  spinner.success({ text: '已删除 ac 和 hq' });

  spinner = createSpinner();
  spinner.start({ text: '正在重命名 sq 为 asset...' });
  await renameSq();
  spinner.success({ text: 'sq 已重命名为 asset' });

  spinner = createSpinner();
  spinner.start({ text: '正在写入新的版本号...' });
  await writeNewVersion();
  spinner.success({ text: '已写入新的版本号' });

  createSpinner().success({ text: '数据已从 v0 升级到 v1' });
  return process.exit();
};
