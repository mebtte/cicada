import { ExceptionCode } from '#/constants/exception';
import {
  AllowUpdateKey,
  LYRIC_MAX_LENGTH,
  MusicType,
  MUSIC_MAX_LRYIC_AMOUNT,
} from '#/constants/music';
import db from '@/db';
import { saveMusicModifyRecord } from '@/db/music_modify_record';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (
    music.type !== MusicType.SONG ||
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

  await Promise.all([
    db.run(
      `
      DELETE FROM lyric
      WHERE musicId = ?
    `,
      [music.id],
    ),
    saveMusicModifyRecord({
      musicId: music.id,
      key: AllowUpdateKey.LYRIC,
      modifyUserId: ctx.user.id,
    }),
  ]);

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
