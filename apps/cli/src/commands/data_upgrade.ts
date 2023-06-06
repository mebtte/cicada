/**
 * v0 --> v1
 * v1 --> v2 应删除重写
 * @author mebtte<hi@mebtte.com>
 */
import inquirer from 'inquirer';
import {
  getAssetDirectory,
  getConfig,
  getDataVersionPath,
  updateConfig,
} from '@/config';
import { createSpinner, Spinner } from 'nanospinner';
import fs from 'fs';
import fsPromises from 'fs/promises';
import exitWithMessage from '@/utils/exit_with_message';
import { AssetType } from '#/constants';
import { getDB } from '@/db';
import generateRandomString from '#/utils/generate_random_string';
import { ID_LENGTH, MusicType } from '#/constants/music';
import {
  MUSICBILL_TABLE_NAME,
  MusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbillProperty,
  USER_TABLE_NAME,
  UserProperty,
} from '@/constants/db_definition';

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
      singers.map((s) => [id, s.singerId]).flat(Infinity),
    );
    if (acMusic.type === MusicType.SONG) {
      const lyrics = await getDB().all<{
        id: string;
        lrc: string;
        lrcContent: string;
      }>(
        `
          SELECT 
            id,
            lrc,
            lrcContent
          FROM lyric
          WHERE musicId = ?
        `,
        [acMusic.id],
      );
      if (lyrics.length) {
        await getDB().run(
          `
            INSERT INTO lyric( musicId, lrc, lrcContent )
            VALUES ${lyrics.map(() => '( ?, ?, ? )').join(', ')}
          `,
          lyrics.map((l) => [id, l.lrc, l.lrcContent]).flat(Infinity),
        );
      }
    }
  }
}

async function migrateMusicHqToSq() {
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

function dropMusicAcAndHq() {
  return Promise.all([
    getDB().run(
      `
        ALTER TABLE music DROP COLUMN ac
      `,
    ),
    getDB().run(
      `
        ALTER TABLE music DROP COLUMN hq
      `,
    ),
  ]);
}

function renameMusicSq() {
  return getDB().run(
    `
      ALTER TABLE music RENAME COLUMN sq TO asset
    `,
  );
}

function addMusicYear() {
  return getDB().run(
    `
      ALTER TABLE music ADD year INTEGER
    `,
  );
}

function addUserLastActiveTimestamp() {
  return getDB().run(
    `
      ALTER TABLE user ADD lastActiveTimestamp INTEGER NOT NULL DEFAULT 0
    `,
  );
}

function createSharedMusicbill() {
  return getDB().run(
    `
      CREATE TABLE ${SHARED_MUSICBILL_TABLE_NAME} (
        ${SharedMusicbillProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${SharedMusicbillProperty.MUSICBILL_ID} TEXT NOT NULL REFERENCES ${MUSICBILL_TABLE_NAME} ( ${MusicbillProperty.ID} ),
        ${SharedMusicbillProperty.SHARED_USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${SharedMusicbillProperty.INVITE_USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${SharedMusicbillProperty.INVITE_TIMESTAMP} INTEGER NOT NULL,
        ${SharedMusicbillProperty.ACCEPTED} INTEGER NOT NULL DEFAULT 0,

        UNIQUE( ${SharedMusicbillProperty.MUSICBILL_ID}, ${SharedMusicbillProperty.SHARED_USER_ID} ) ON CONFLICT REPLACE
      )
    `,
  );
}

function addUserMusicPlayRecordIndate() {
  return getDB().run(
    `
      ALTER TABLE user ADD musicPlayRecordIndate INTEGER NOT NULL DEFAULT 0
    `,
  );
}

function dropMusicbillExport() {
  return Promise.all([
    getDB().run(
      `
        ALTER TABLE user DROP COLUMN exportMusicbillMaxTimePerDay
      `,
    ),
    getDB().run(
      `
        DROP TABLE musicbill_export
      `,
    ),
    fsPromises.rm(`${getConfig().data}/downloads`, {
      recursive: true,
      force: true,
    }),
  ]);
}

function renameMusicbillCollection() {
  return getDB().run(
    `
      ALTER TABLE musicbill_collection RENAME TO public_musicbill_collection
    `,
  );
}

function writeNewVersion() {
  return fsPromises.writeFile(getDataVersionPath(), '1');
}

export default async ({ data }: { data: string }) => {
  updateConfig({ data });

  if (!fs.existsSync(getDataVersionPath())) {
    return exitWithMessage(`[ ${data} ] isn't a valid datadirectory`);
  }
  const dataVersion = Number(
    fs.readFileSync(getDataVersionPath()).toString().replace(/\s/gm, ''),
  );
  if (dataVersion !== 0) {
    return exitWithMessage(
      `This version of cicada can upgrade data only v0, your data version is v${dataVersion}`,
    );
  }

  const answer: { confirmed: boolean } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message:
        "It's important to backup your data before upgrading. Continue ?",
      default: false,
    },
  ]);
  if (!answer.confirmed) {
    return;
  }

  let spinner: Spinner;

  spinner = createSpinner();
  spinner.start({ text: "Combining music's asset..." });
  await combineMusicAsset();
  spinner.success({ text: "Music's asset combined" });

  spinner = createSpinner();
  spinner.start({ text: 'Separating music.ac...' });
  await separateMusicAc();
  spinner.success({ text: 'Music.ac separated' });

  spinner = createSpinner();
  spinner.start({ text: 'Migrating music.hq to music.sq...' });
  await migrateMusicHqToSq();
  spinner.success({ text: 'music.hq has migrated to music.sq' });

  spinner = createSpinner();
  spinner.start({ text: 'Deleting music.ac and music.hq...' });
  await dropMusicAcAndHq();
  spinner.success({ text: 'music.ac and music.hq deleted' });

  spinner = createSpinner();
  spinner.start({ text: 'Renaming music.sq to music.asset...' });
  await renameMusicSq();
  spinner.success({ text: 'music.sq has renamed to music.asset' });

  spinner = createSpinner();
  spinner.start({ text: 'Adding music.year...' });
  await addMusicYear();
  spinner.success({ text: 'music.year added' });

  spinner = createSpinner();
  spinner.start({ text: 'Adding user.lastActiveTimestamp...' });
  await addUserLastActiveTimestamp();
  spinner.success({ text: 'user.lastActiveTimestamp added' });

  spinner = createSpinner();
  spinner.start({ text: 'Adding user.musicPlayRecordIndate...' });
  await addUserMusicPlayRecordIndate();
  spinner.success({ text: 'user.musicPlayRecordIndate added' });

  spinner = createSpinner();
  spinner.start({ text: 'Creating shared_musicbill...' });
  await createSharedMusicbill();
  spinner.success({ text: 'shared_musicbill created' });

  spinner = createSpinner();
  spinner.start({ text: 'Dropping musicbill_export...' });
  await dropMusicbillExport();
  spinner.success({ text: 'musicbill_export dropped' });

  spinner = createSpinner();
  spinner.start({
    text: 'Renaming musicbill_collection to public_musicbill_collection...',
  });
  await renameMusicbillCollection();
  spinner.success({
    text: 'musicbill_collection has renamed to public_musicbill_collection',
  });

  spinner = createSpinner();
  spinner.start({ text: 'Writting new version of data...' });
  await writeNewVersion();
  spinner.success({ text: 'New version of data wrote' });

  createSpinner().success({ text: 'Data upgrade to v1 from v0 successfully' });
  return process.exit();
};
