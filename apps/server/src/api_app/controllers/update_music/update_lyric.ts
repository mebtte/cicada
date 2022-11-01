import { ExceptionCode } from '#/constants/exception';
import { LYRIC_MAX_LENGTH, MUSIC_MAX_LRYIC_AMOUNT } from '#/constants/music';
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

  const trimmedAliases: string[] = value.map((v) => v.trim());
  if (trimmedAliases.find((a) => a.length === 0)) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  await db.run(
    `
      DELETE FROM lyric
      WHERE musicId = ?
    `,
    [music.id],
  );

  if (value.length) {
    await db.run(
      `
        INSERT INTO lyric ( musicId, content )
        VALUES ${value.map(() => `( ?, ? )`).join(', ')}
      `,
      value.map((v) => [music.id, v]).flat(),
    );
  }

  return ctx.success();
};
