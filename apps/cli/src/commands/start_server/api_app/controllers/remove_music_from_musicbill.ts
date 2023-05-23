import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById } from '@/db/musicbill';
import {
  getMusicbillMusic,
  removeMusicbillMusicById,
} from '@/db/musicbill_music';
import {
  MusicbillMusicProperty,
  MusicbillProperty,
} from '@/constants/db_definition';
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
  if (!musicbill || musicbill.userId !== ctx.user.id) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const musicbillMusic = await getMusicbillMusic(musicbillId, musicId, [
    MusicbillMusicProperty.ID,
  ]);
  if (!musicbillMusic) {
    return ctx.except(ExceptionCode.MUSIC_NOT_IN_MUSICBILL);
  }

  await removeMusicbillMusicById(musicbillMusic.id);
  return ctx.success(null);
};
