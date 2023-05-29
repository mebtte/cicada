import { ExceptionCode } from '#/constants/exception';
import { getMusicById } from '@/db/music';
import { getLyricListByMusicId } from '@/db/lyric';
import { MusicType } from '#/constants/music';
import { LyricProperty, MusicProperty } from '@/constants/db_definition';
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

  const lyrics = await getLyricListByMusicId(musicId, [
    LyricProperty.ID,
    LyricProperty.LRC,
  ]);

  return ctx.success(lyrics);
};
