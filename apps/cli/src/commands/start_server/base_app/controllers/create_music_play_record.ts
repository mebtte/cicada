import { EFFECTIVE_PLAY_PERCENT } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import {
  MUSIC_TABLE_NAME,
  MusicProperty,
  UserProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getMusicById } from '@/db/music';
import addMusicPlayRecord from '@/db/add_music_play_record';
import { verify } from '@/platform/jwt';
import { getUserById } from '@/db/user';
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
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  let tokenPayload: { userId: string; tokenIdentifier: string };
  try {
    tokenPayload = verify(token);
  } catch (error) {
    return ctx.except(ExceptionCode.NOT_AUTHORIZED);
  }

  const user = await getUserById(tokenPayload.userId, [
    UserProperty.ID,
    UserProperty.TOKEN_IDENTIFIER,
  ]);
  if (!user || user.tokenIdentifier !== tokenPayload.tokenIdentifier) {
    return ctx.except(ExceptionCode.NOT_AUTHORIZED);
  }

  const music = await getMusicById(musicId, [MusicProperty.ID]);
  if (!music) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXISTED);
  }

  await addMusicPlayRecord({ userId: tokenPayload.userId, musicId, percent });

  /** 有效播放次数 */
  if (percent >= EFFECTIVE_PLAY_PERCENT) {
    getDB().run(
      `
        UPDATE ${MUSIC_TABLE_NAME} SET ${MusicProperty.HEAT} = ${MusicProperty.HEAT} + 1
        WHERE ${MusicProperty.ID} = ?
      `,
      [musicId],
    );
  }

  return ctx.success(null);
};
