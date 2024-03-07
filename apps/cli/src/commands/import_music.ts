import { getUserById } from '@/db/user';
import {
  createSinger,
  getSingerByName,
  getSingerListInMusicIds,
} from '@/db/singer';
import exitWithMessage from '@/utils/exit_with_message';
import fs from 'fs/promises';
import { createSpinner } from 'nanospinner';
import fileType from 'file-type';
import { AssetType, ASSET_TYPE_MAP } from '#/constants';
import path from 'path';
import { getDB } from '@/db';
import createMusic from '@/db/create_music';
import md5 from 'md5';
import { MusicType } from '#/constants/music';
import {
  Music,
  MusicProperty,
  UserProperty,
  SingerProperty,
  MUSIC_TABLE_NAME,
  MUSIC_SINGER_RELATION_TABLE_NAME,
  MusicSingerRelationProperty,
} from '@/constants/db_definition';
import { getAssetDirectory, updateConfig } from '../config';

/**
 * 文件格式, singer1,singer2 - name.format
 * @author mebtte<hi@mebtte.com>
 */
const MATCH_FILENAME = /^((([^,]+)(,?))+)(\s+)-(\s+)(.+)\.(\S+)$/;

let successful = 0;
let ignored = 0;

/**
 * 合并多个空格以及移除头尾空格
 * @author mebtte<hi@mebtte.com>
 */
function handleSpace(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * 检查音乐是否已存在
 * @author mebtte<hi@mebtte.com>
 */
async function checkMusicExist({
  singers,
  name,
}: {
  singers: string[];
  name: string;
}) {
  const sameNameMusicList = await getDB().all<
    Pick<Music, MusicProperty.ID | MusicProperty.NAME>
  >(
    `
      SELECT
        ${MusicProperty.ID},
        ${MusicProperty.NAME}
      FROM ${MUSIC_TABLE_NAME}
      WHERE ${MusicProperty.NAME} = ?
    `,
    [name],
  );

  if (sameNameMusicList.length) {
    const singerList = await getSingerListInMusicIds(
      sameNameMusicList.map((m) => m.id),
      [SingerProperty.ID, SingerProperty.NAME],
    );

    const sortedSingerListString = singers.sort().toString();
    for (const music of sameNameMusicList) {
      const musicSingers = singerList
        .filter((s) => s.musicId === music.id)
        .map((s) => s.name)
        .sort();
      if (musicSingers.toString() === sortedSingerListString) {
        return true;
      }
    }
  }

  return false;
}

async function importFile(
  file: string,
  {
    skipExistenceCheck,
    uid,
  }: {
    skipExistenceCheck: boolean;
    uid: string;
  },
) {
  const spinner = createSpinner(file);
  spinner.start();

  /**
   * 检查文件名
   * @author mebtte<hi@mebtte.com>
   */
  if (!MATCH_FILENAME.test(path.parse(file).base)) {
    ignored += 1;
    return spinner.warn({
      text: `[ ${file} ] isn't a valid filename, ignored`,
    });
  }

  /**
   * 检查文件类型
   * @author mebtte<hi@mebtte.com>
   */
  const ft = await fileType.fromFile(file);
  const { acceptTypes } = ASSET_TYPE_MAP[AssetType.MUSIC];
  if (ft && acceptTypes.includes(ft.mime)) {
    const [singerString, originalName] = path.parse(file).name.split(' - ');
    const name = handleSpace(originalName);
    const singers = singerString
      .split(',')
      .map((s) => handleSpace(s))
      .filter((s) => s.length > 0);

    if (!skipExistenceCheck) {
      const exist = await checkMusicExist({ singers, name });
      if (exist) {
        ignored += 1;
        return spinner.warn({
          text: `[ ${file} ] has been database already and ignored, using [ --skip-existence-check ] will skip existence check`,
        });
      }
    }

    const fileData = await fs.readFile(file);
    const assetName = md5(fileData) + path.parse(file).ext;
    await fs.writeFile(
      `${getAssetDirectory(AssetType.MUSIC)}/${assetName}`,
      fileData,
    );

    const id = await createMusic({
      name,
      type: MusicType.SONG,
      createUserId: uid,
      asset: assetName,
    });

    for (const singer of singers) {
      const s = await getSingerByName(singer, [SingerProperty.ID]);
      let singerId: string;
      if (!s) {
        singerId = await createSinger({
          name: singer,
          createUserId: uid,
        });
      } else {
        singerId = s.id;
      }
      await getDB().run(
        `
          INSERT INTO ${MUSIC_SINGER_RELATION_TABLE_NAME} ( ${MusicSingerRelationProperty.MUSIC_ID}, ${MusicSingerRelationProperty.SINGER_ID} )
          VALUES( ?, ? )
        `,
        [id, singerId],
      );
    }

    spinner.success({
      text: `[ ${file} ] imported`,
    });

    successful += 1;
  } else {
    spinner.warn({ text: `[ ${file} ] isn't a valid format, ignored` });
    ignored += 1;
  }
}

async function importDirectory(
  directory: string,
  {
    recursive,
    skipExistenceCheck,
    uid,
  }: {
    recursive: boolean;
    skipExistenceCheck: boolean;
    uid: string;
  },
) {
  /**
   * 过滤隐藏文件
   * @author mebtte<hi@mebtte.com>
   */
  const files = (await fs.readdir(directory)).filter((f) => !f.startsWith('.'));
  for (const file of files) {
    const absolutePath = `${directory}/${file}`;
    const stat = await fs.stat(absolutePath);
    if (stat.isFile()) {
      await importFile(absolutePath, { skipExistenceCheck, uid });
    } else if (recursive) {
      await importDirectory(absolutePath, {
        recursive,
        skipExistenceCheck,
        uid,
      });
    } else {
      createSpinner().warn({
        text: `[ ${absolutePath} ] is a directory and ignored, using [ -r/--recursive ] will scan sub directories recursively`,
      });
      ignored += 1;
    }
  }
}

export default async ({
  source,
  data,
  uid,
  recursive,
  skipExistenceCheck,
}: {
  source: string;
  data: string;
  uid: string;
  recursive: boolean;
  skipExistenceCheck: boolean;
}) => {
  updateConfig({ data });

  /**
   * 检查 uid 是否存在
   * @author mebtte<hi@mebtte.com>
   */
  const user = await getUserById(uid, [UserProperty.ID]);
  if (!user) {
    return exitWithMessage(`User [ id=${uid} ] doesn't exist`);
  }

  const sourceStat = await fs.stat(source);
  if (sourceStat.isDirectory()) {
    await importDirectory(source, { recursive, skipExistenceCheck, uid });
  } else {
    await importFile(source, { skipExistenceCheck, uid });
  }

  createSpinner().success({
    text: `Successful ${successful}, ignored ${ignored}`,
  });
  return process.exit();
};
