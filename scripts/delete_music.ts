#!/usr/bin/env -S node -r ts-node/register
/* eslint-disable no-console */
import * as yargs from 'yargs';
import fs from 'fs/promises';
import { DB_FILENAME, TRASH_FILENAME } from '../shared/constants';
import argvJSON from '../argv.json';
import DB from '../shared/utils/db';
import question from '../shared/utils/question';
import generateRandomInteger from '../shared/utils/generate_random_integer';
import { MusicType } from '../shared/constants/music';

const db = new DB(`${argvJSON.base}/${DB_FILENAME}`);
const argv = yargs.parse(process.argv) as {
  id?: string;
};

async function deleteMusic() {
  if (!argv.id) {
    throw new Error('请通过 --id 指明音乐 ID');
  }

  const { id } = argv;
  const music = await db.get<{
    id: string;
    type: MusicType;
    effectivePlayTimes: number;
  }>(
    `
      select * from music where id = ?
    `,
    [id],
  );

  if (!music) {
    throw new Error(`音乐「${id}」不存在`);
  }

  const musicForkFrom = await db.get<{ id: number }>(
    `
      select id from music_fork where forkFrom = ?
    `,
    [id],
  );
  if (musicForkFrom) {
    throw new Error(`音乐「${id}」存在翻唱, 请移除翻唱后再进行删除操作`);
  }

  if (music.effectivePlayTimes > 0) {
    const randomNumber = generateRandomInteger(100, 999);
    const input = await question(
      `当前音乐有效播放次数大于 1, 如果仍要删除, 请输入验证码 ${randomNumber}: `,
    );
    if (input !== randomNumber.toString()) {
      throw new Error('错误的验证码');
    }
  }

  let lyric: unknown = null;
  if (music.type === MusicType.SONG) {
    lyric = await db.get(
      `
        select * from lyric where musicId = ?
      `,
      [id],
    );
  }

  const [
    forkList,
    modifyRecordList,
    playRecordList,
    singerRelationList,
    musicbillMusicList,
  ] = await Promise.all([
    db.all(
      `
        select * from music_fork where musicId = ?
      `,
      [id],
    ),
    db.all(
      `
        select * from music_modify_record where musicId = ?
      `,
      [id],
    ),
    db.all(
      `
        select * from music_play_record where musicId = ?
      `,
      [id],
    ),
    db.all(
      `
        select * from music_singer_relation where musicId = ?
      `,
      [id],
    ),
    db.all(
      `
        select * from musicbill_music where musicId = ?
      `,
      [id],
    ),
  ]);

  await fs.writeFile(
    `${argvJSON.base}/${TRASH_FILENAME}/deleted_music_${id}.json`,
    JSON.stringify({
      ...music,
      lyric,
      forkList,
      modifyRecordList,
      playRecordList,
      singerRelationList,
      musicbillMusicList,
    }),
  );

  if (lyric) {
    await db.run(
      `
        delete from lyric where musicId = ?
      `,
      [id],
    );
  }
  await Promise.all([
    db.run(
      `
        delete from music_fork where musicId = ?
      `,
      [id],
    ),
    db.run(
      `
        delete from music_modify_record where musicId = ?
      `,
      [id],
    ),
    db.run(
      `
        delete from music_play_record where musicId = ?
      `,
      [id],
    ),
    db.run(
      `
        delete from music_singer_relation where musicId = ?
      `,
      [id],
    ),
    db.run(
      `
        delete from musicbill_music where musicId = ?
      `,
      [id],
    ),
  ]);
  await db.run(
    `
      delete from music where id = ?
    `,
    [id],
  );
}

deleteMusic();
