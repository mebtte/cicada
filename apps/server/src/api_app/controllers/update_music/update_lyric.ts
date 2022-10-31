import { ExceptionCode } from '#/constants/exception';
import { LYRIC_MAX_LENGTH, MUSIC_MAX_LRYIC_AMOUNT } from '#/constants/music';
import { createLyric } from '@/db/lyric';
import db from '@/db';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (
    !Array.isArray(value) ||
    value.length > MUSIC_MAX_LRYIC_AMOUNT ||
    value.find((v) => typeof v !== 'string' || v.length > LYRIC_MAX_LENGTH)
  ) {
    return ctx.error(ExceptionCode.PARAMETER_ERROR);
  }

  await db.run(
    `
      DELETE FROM lyric
      WHERE musicId = ?
    `,
    [music.id],
  );
  await Promise.all(
    value.map((content) => createLyric({ musicId: music.id, content })),
  );

  return ctx.success();
};
