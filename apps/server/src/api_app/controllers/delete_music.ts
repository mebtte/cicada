import fs from 'fs/promises';
import { ExceptionCode } from '#/constants/exception';
import { getLyricListByMusicId, Property as LyricProperty } from '@/db/lyric';
import { getMusicById, Property as MusicProperty } from '@/db/music';
import {
  getMusicModifyRecordList,
  Property as MusicModifyRecordProperty,
} from '@/db/music_modify_record';
import {
  getMusicForkFromList,
  getMusicForkList,
  Property as MusicForkProperty,
} from '@/db/music_fork';
import {
  getMusicPlayRecordList,
  Property as MusicPlayRecordProperty,
} from '@/db/music_play_record';
import { getDB } from '@/db';
import { MusicType } from '#/constants/music';
import { getTrashDirectory } from '@/config';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: unknown };
  if (typeof id !== 'string' || id.length === 0) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const music = await getMusicById(id, Object.values(MusicProperty));
  if (!music || (!ctx.user.admin && music.createUserId !== ctx.user.id)) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXIST);
  }

  const forkList = await getMusicForkList(id, [
    MusicForkProperty.ID,
    MusicForkProperty.MUSIC_ID,
  ]);
  if (forkList.length) {
    return ctx.except(ExceptionCode.MUSIC_HAS_FORK_AND_CAN_NOT_BE_DELETED);
  }

  const [
    lyricList,
    forkFromList,
    musicModifyRecordList,
    musicPlayRecordList,
    singerList,
    musicbillMusicList,
  ] = await Promise.all([
    music.type === MusicType.SONG
      ? getLyricListByMusicId(id, [LyricProperty.ID, LyricProperty.LRC])
      : [],
    getMusicForkFromList(id, [
      MusicForkProperty.ID,
      MusicForkProperty.FORK_FROM,
    ]),
    getMusicModifyRecordList(id, [
      MusicModifyRecordProperty.ID,
      MusicModifyRecordProperty.KEY,
      MusicModifyRecordProperty.MODIFY_TIMESTAMP,
      MusicModifyRecordProperty.MODIFY_USER_ID,
    ]),
    getMusicPlayRecordList(id, [
      MusicPlayRecordProperty.ID,
      MusicPlayRecordProperty.PERCENT,
      MusicPlayRecordProperty.TIMESTAMP,
      MusicPlayRecordProperty.USER_ID,
    ]),
    getDB().all<{ id: string; name: string }>(
      `
        SELECT s.id, s.name FROM music_singer_relation as msr
        LEFT JOIN singer as s
          ON msr.singerId = s.id
        WHERE msr.musicId = ?
      `,
      [id],
    ),
    getDB().all<{
      id: number;
      musicbillId: string;
      addTimestamp: number;
    }>(
      `
        SELECT id, musicbillId, addTimestamp FROM musicbill_music
        WHERE musicId = ?
      `,
      [id],
    ),
  ]);

  await Promise.all([
    fs.writeFile(
      `${getTrashDirectory()}/deleted_music_${id}.json`,
      JSON.stringify({
        ...music,
        lyricList,
        forkFromList,
        musicModifyRecordList,
        musicPlayRecordList,
        singerList,
        musicbillMusicList,
      }),
    ),
    music.type === MusicType.SONG
      ? getDB().run(
          `
        DELETE FROM lyric
        WHERE musicId = ?
      `,
          [id],
        )
      : null,
    getDB().run(
      `
        DELETE FROM music_fork
        WHERE musicId = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM music_modify_record
        WHERE musicId = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM music_play_record
        WHERE musicId = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM music_singer_relation
        WHERE musicId = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM musicbill_music
        WHERE musicId = ?
      `,
      [id],
    ),
  ]);
  await getDB().run(
    `
      DELETE FROM music
      WHERE id = ?
    `,
    [id],
  );

  return ctx.success();
};
