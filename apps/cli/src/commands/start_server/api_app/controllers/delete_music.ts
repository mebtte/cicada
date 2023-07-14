import { ExceptionCode } from '#/constants/exception';
import { getMusicById } from '@/db/music';
import { getMusicForkList } from '@/db/music_fork';
import { getDB } from '@/db';
import { MusicType } from '#/constants/music';
import {
  LYRIC_TABLE_NAME,
  LyricProperty,
  MUSICBILL_MUSIC_TABLE_NAME,
  MUSIC_FORK_TABLE_NAME,
  MUSIC_MODIFY_RECORD_TABLE_NAME,
  MUSIC_PLAY_RECORD_TABLE_NAME,
  MUSIC_SINGER_RELATION_TABLE_NAME,
  MUSIC_TABLE_NAME,
  MusicForkProperty,
  MusicModifyRecordProperty,
  MusicPlayRecordProperty,
  MusicProperty,
  MusicSingerRelationProperty,
  MusicbillMusicProperty,
} from '@/constants/db_definition';
import { verifyCaptcha } from '@/platform/captcha';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id, captchaId, captchaValue } = ctx.query as {
    id?: unknown;
    captchaId?: string;
    captchaValue?: string;
  };
  if (
    typeof id !== 'string' ||
    !id.length ||
    typeof captchaId !== 'string' ||
    !captchaId.length ||
    typeof captchaValue !== 'string' ||
    !captchaValue.length
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const captchaVerified = await verifyCaptcha({
    id: captchaId,
    value: captchaValue,
  });
  if (!captchaVerified) {
    return ctx.except(ExceptionCode.CAPTCHA_ERROR);
  }

  const music = await getMusicById(id, Object.values(MusicProperty));
  if (!music || (!ctx.user.admin && music.createUserId !== ctx.user.id)) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXISTED);
  }

  const forkList = await getMusicForkList(id, [
    MusicForkProperty.ID,
    MusicForkProperty.MUSIC_ID,
  ]);
  if (forkList.length) {
    return ctx.except(ExceptionCode.MUSIC_HAS_FORK_AND_CAN_NOT_BE_DELETED);
  }

  await Promise.all([
    music.type === MusicType.SONG
      ? getDB().run(
          `
            DELETE FROM ${LYRIC_TABLE_NAME}
            WHERE ${LyricProperty.MUSIC_ID} = ?
          `,
          [id],
        )
      : null,
    getDB().run(
      `
        DELETE FROM ${MUSIC_FORK_TABLE_NAME}
        WHERE ${MusicForkProperty.MUSIC_ID} = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM ${MUSIC_MODIFY_RECORD_TABLE_NAME}
        WHERE ${MusicModifyRecordProperty.MUSIC_ID} = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM ${MUSIC_PLAY_RECORD_TABLE_NAME}
        WHERE ${MusicPlayRecordProperty.MUSIC_ID} = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM ${MUSIC_SINGER_RELATION_TABLE_NAME}
        WHERE ${MusicSingerRelationProperty.MUSIC_ID} = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM ${MUSICBILL_MUSIC_TABLE_NAME}
        WHERE ${MusicbillMusicProperty.MUSIC_ID} = ?
      `,
      [id],
    ),
  ]);
  await getDB().run(
    `
      DELETE FROM ${MUSIC_TABLE_NAME}
      WHERE ${MusicProperty.ID} = ?
    `,
    [id],
  );

  return ctx.success(null);
};
