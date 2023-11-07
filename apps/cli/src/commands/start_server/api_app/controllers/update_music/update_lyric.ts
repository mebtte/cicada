import { ExceptionCode } from '#/constants/exception';
import {
  AllowUpdateKey,
  LYRIC_MAX_LENGTH,
  MusicType,
  MUSIC_MAX_LRYIC_AMOUNT,
} from '#/constants/music';
import { getDB } from '@/db';
import { saveMusicModifyRecord } from '@/db/music_modify_record';
import { parse, LineType, LyricLine } from 'clrc';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (
    music.type !== MusicType.SONG ||
    !Array.isArray(value) ||
    value.length > MUSIC_MAX_LRYIC_AMOUNT ||
    value.find((v) => typeof v !== 'string' || v.length > LYRIC_MAX_LENGTH)
  ) {
    return ctx.error(ExceptionCode.WRONG_PARAMETER);
  }

  const trimmedLyrics: string[] = value.map((v) => v.trim());
  if (trimmedLyrics.find((a) => a.length === 0)) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  await Promise.all([
    getDB().run(
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
    await getDB().run(
      `
        INSERT INTO lyric ( musicId, lrc, lrcContent )
        VALUES ${value.map(() => `( ?, ?, ? )`).join(', ')}
      `,
      value
        .map((v) => [
          music.id,
          v,
          parse(v)
            .filter((line) => line.type === LineType.LYRIC)
            .map((line) =>
              (line as LyricLine).content.replace(/\s+/g, ' ').trim(),
            )
            .join('\n'),
        ])
        .flat(),
    );
  }

  return ctx.success(null);
};
