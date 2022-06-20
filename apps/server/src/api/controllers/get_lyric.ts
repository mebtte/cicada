import { ExceptionCode } from '#/constants/exception';
import { getMusicById, Property as MusicProperty } from '@/db/music';
import { getLyricByMusicId, Property as LyricProperty } from '@/db/lyric';
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

  const lyric = await getLyricByMusicId(musicId, [LyricProperty.CONTENT]);
  if (!lyric) {
    return ctx.except(ExceptionCode.LYRIC_NOT_EXIST);
  }
  return ctx.success(lyric.content);
};
