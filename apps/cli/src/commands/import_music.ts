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
import getMusicFileMetadata, {
  Metadata,
} from '#/utils/get_music_file_metadata';

let successful = 0;
let ignored = 0;

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
  filepath: string,
  {
    skipExistenceCheck,
    uid,
  }: {
    skipExistenceCheck: boolean;
    uid: string;
  },
) {
  const spinner = createSpinner(filepath).start();

  /**
   * 检查文件类型
   * @author mebtte<hi@mebtte.com>
   */
  const ft = await fileType.fromFile(filepath);
  const { acceptTypes } = ASSET_TYPE_MAP[AssetType.MUSIC];
  if (ft && acceptTypes.includes(ft.mime)) {
    let musicTag: Metadata;
    try {
      musicTag = await getMusicFileMetadata(filepath);
    } catch (error) {
      ignored += 1;
      return spinner.warn({
        text: `[ ${filepath} ] can not be parsed and been ignored`,
      });
    }
    const name = musicTag.title || 'Unknown';
    const singers = musicTag.artist?.split(',') || ['Unknown'];
    if (!skipExistenceCheck) {
      const exist = await checkMusicExist({ singers, name });
      if (exist) {
        ignored += 1;
        return spinner.warn({
          text: `[ ${filepath} ] has been in database already and ignored, using [ --skip-existence-check ] will skip existence check`,
        });
      }
    }

    const fileData = await fs.readFile(filepath);
    const assetName = md5(fileData) + path.parse(filepath).ext;
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

    if (musicTag.year) {
      await getDB().run(
        `
          UPDATE ${MUSIC_TABLE_NAME} SET ${MusicProperty.YEAR} = ?
          WHERE ${MusicProperty.ID} = ?
        `,
        [musicTag.year, id],
      );
    }

    if (musicTag.picture) {
      const buffer = Buffer.from(
        musicTag.picture.dataURI.split(',')[1],
        'base64',
      );
      const coverFilename = `${md5(buffer)}.${
        musicTag.picture.format.split('/')[1]
      }`;
      await Promise.all([
        fs.writeFile(
          `${getAssetDirectory(AssetType.MUSIC_COVER)}/${coverFilename}`,
          buffer,
        ),
        getDB().run(
          `
            UPDATE ${MUSIC_TABLE_NAME} SET ${MusicProperty.COVER} = ?
            WHERE ${MusicProperty.ID} = ?
          `,
          [coverFilename, id],
        ),
      ]);
    }

    successful += 1;
    spinner.success({
      text: `[ ${filepath} ] imported`,
    });
  } else {
    ignored += 1;
    spinner.warn({ text: `[ ${filepath} ] isn't a valid format, ignored` });
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

async function importMusic({
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
}) {
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
}

export default importMusic;
