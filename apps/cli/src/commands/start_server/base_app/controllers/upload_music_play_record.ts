import { EFFECTIVE_PLAY_PERCENT } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { MusicProperty } from '@/constants/db_definition';
import { getDB } from '@/db';
import { getMusicById } from '@/db/music';
import addMusicPlayRecord from '@/db/add_music_play_record';
import { verify } from '@/platform/jwt';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { token, musicId, percent } = ctx.request.body as {
    token?: string;
    musicId?: string;
    percent?: number;
  };
  if (
    typeof token !== 'string' ||
    !token.length ||
    typeof musicId !== 'string' ||
    !musicId.length ||
    typeof percent !== 'number' ||
    percent < 0 ||
    percent > 1
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  let userId: string | undefined;
  try {
    userId = verify(token);
  } catch (error) {
    return ctx.except(ExceptionCode.NOT_AUTHORIZED);
  }

  const music = await getMusicById(musicId, [MusicProperty.ID]);
  if (!music) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXISTED);
  }

  await addMusicPlayRecord({ userId, musicId, percent });

  /** 有效播放次数 */
  if (percent >= EFFECTIVE_PLAY_PERCENT) {
    getDB().run(
      `
        UPDATE music SET heat = heat + 1
        WHERE id = ?;
      `,
      [musicId],
    );
  }

  return ctx.success(null);
};
