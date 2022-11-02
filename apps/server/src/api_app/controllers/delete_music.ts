import { ExceptionCode } from '#/constants/exception';
import { getLyricListByMusicId, Property as LyricProperty } from '@/db/lyric';
import { getMusicById, Property as MusicProperty } from '@/db/music';
import { getMusicForkFromList, getMusicForkList } from '@/db/music_fork';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: unknown };
  if (typeof id !== 'string' || id.length === 0) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const music = await getMusicById(id, Object.values(MusicProperty));
  if (!music || music.createUserId !== ctx.user.id) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXIST);
  }

  const forkList = await getMusicForkList(id);
  if (forkList.length) {
    return ctx.except(ExceptionCode.MUSIC_HAS_FORK_AND_CAN_NOT_BE_DELETED);
  }

  const [lyrics, forkFromList] = await Promise.all([
    getLyricListByMusicId(id, [LyricProperty.ID, LyricProperty.CONTENT]),
    getMusicForkFromList(id),
  ]);
};
