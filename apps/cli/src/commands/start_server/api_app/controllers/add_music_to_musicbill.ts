import { ExceptionCode } from '#/constants/exception';
import {
  MusicbillMusicProperty,
  MusicbillProperty,
  MusicProperty,
  SharedMusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getMusicById } from '@/db/music';
import { getMusicbillById } from '@/db/musicbill';
import { addMusicbillMusic, getMusicbillMusic } from '@/db/musicbill_music';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { musicbillId, musicId } = ctx.request.body as {
    musicbillId?: unknown;
    musicId?: unknown;
  };

  if (
    typeof musicbillId !== 'string' ||
    !musicbillId.length ||
    typeof musicId !== 'string' ||
    !musicId.length
  ) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const [musicbill, music] = await Promise.all([
    getMusicbillById(musicbillId, [MusicbillProperty.USER_ID]),
    getMusicById(musicId, [MusicProperty.ID]),
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

  if (!music) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXISTED);
  }

  const musicbillMusic = await getMusicbillMusic(musicbillId, musicId, [
    MusicbillMusicProperty.ID,
  ]);
  if (musicbillMusic) {
    return ctx.except(ExceptionCode.MUSIC_ALREADY_EXISTED_IN_MUSICBILL);
  }

  await addMusicbillMusic(musicbillId, musicId);
  return ctx.success(null);
};
