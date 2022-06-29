import { ExceptionCode } from '#/constants/exception';
import { getMusicById, Property as MusicProperty } from '@/db/music';
import { getLyricByMusicId, Property as LyricProperty } from '@/db/lyric';
import { MusicType } from '#/constants/music';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { musicId } = ctx.query as { musicId?: string };

  if (!musicId) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const music = await getMusicById(musicId, [
    MusicProperty.ID,
    MusicProperty.TYPE,
  ]);
  if (!music) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXIST);
  }
  if (music.type === MusicType.INSTRUMENT) {
    return ctx.except(ExceptionCode.INSTRUMENT_NO_LYRIC);
  }

  const lyric = await getLyricByMusicId(musicId, [LyricProperty.CONTENT]);
  if (!lyric) {
    return ctx.except(ExceptionCode.LYRIC_NOT_EXIST);
  }
  return ctx.success(lyric.content);
};
