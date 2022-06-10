import { ExceptionCode } from '#/constants/exception';
import { getMusicById, Property as MusicProperty } from '@/db/music';
import {
  getMusicLrcByMusicId,
  Property as MusicLrcProperty,
} from '@/db/music_lrc';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { musicId } = ctx.query as { musicId?: string };

  if (!musicId) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const music = await getMusicById(musicId, [MusicProperty.ID]);
  if (!music) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXIST);
  }

  const musicLrc = await getMusicLrcByMusicId(musicId, [MusicLrcProperty.LRC]);
  if (!musicLrc) {
    return ctx.except(ExceptionCode.MUSIC_LRC_NOT_EXIST);
  }
  return ctx.success(musicLrc);
};
