import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById } from '@/db/musicbill';
import {
  getMusicbillMusic,
  removeMusicbillMusicById,
} from '@/db/musicbill_music';
import {
  MusicbillMusicProperty,
  MusicbillProperty,
  SharedMusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { musicbillId, musicId } = ctx.query as {
    musicbillId?: string;
    musicId?: string;
  };
  if (
    typeof musicbillId !== 'string' ||
    !musicbillId.length ||
    typeof musicId !== 'string' ||
    !musicId.length
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(musicbillId, [
    MusicbillProperty.USER_ID,
  ]);
  if (!musicbill) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXISTED);
  }
  if (musicbill.userId !== ctx.user.id) {
    const sharedUser = await getDB().get(
      `
        SELECT
          ${SharedMusicbillProperty.ID}
        FROM ${SHARED_MUSICBILL_TABLE_NAME}
        WHERE ${SharedMusicbillProperty.MUSICBILL_ID} = ?
          AND ${SharedMusicbillProperty.SHARED_USER_ID} = ?
          AND ${SharedMusicbillProperty.ACCEPTED} = 1
      `,
      [musicbillId, ctx.user.id],
    );
    if (!sharedUser) {
      return ctx.except(ExceptionCode.MUSICBILL_NOT_EXISTED);
    }
  }

  const musicbillMusic = await getMusicbillMusic(musicbillId, musicId, [
    MusicbillMusicProperty.ID,
  ]);
  if (!musicbillMusic) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXISTED_IN_MUSICBILL);
  }

  await removeMusicbillMusicById(musicbillMusic.id);
  return ctx.success(null);
};
