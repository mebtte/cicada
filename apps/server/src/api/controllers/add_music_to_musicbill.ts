import { ExceptionCode } from '#/constants/exception';
import { getMusicById, Property as MusicProperty } from '@/db/music';
import {
  getMusicbillById,
  Property as MusicbillProperty,
} from '@/db/musicbill';
import {
  addMusicbillMusic,
  getMusicbillMusic,
  Property as MusicbillMusicProperty,
} from '@/db/musicbill_music';
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
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const [musicbill, music] = await Promise.all([
    getMusicbillById(musicbillId, [MusicbillProperty.USER_ID]),
    getMusicById(musicId, [MusicProperty.ID]),
  ]);

  if (!musicbill || musicbill.userId !== ctx.user.id) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }
  if (!music) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXIST);
  }

  const musicbillMusic = await getMusicbillMusic(musicbillId, musicId, [
    MusicbillMusicProperty.ID,
  ]);
  if (musicbillMusic) {
    return ctx.except(ExceptionCode.MUSIC_IN_MUSICBILL_ALREADY);
  }
  await addMusicbillMusic(musicbillId, musicId);

  return ctx.success();
};
