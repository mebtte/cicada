import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById } from '@/db/musicbill';
import { getDB } from '@/db';
import {
  MUSICBILL_MUSIC_TABLE_NAME,
  MUSICBILL_TABLE_NAME,
  MusicbillMusicProperty,
  MusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbillProperty,
} from '@/constants/db_definition';
import { verifyCaptcha } from '@/platform/captcha';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id, captchaId, captchaValue } = ctx.query as {
    id?: unknown;
    captchaId?: unknown;
    captchaValue?: unknown;
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

  const captcahVerified = await verifyCaptcha({
    id: captchaId,
    value: captchaValue,
  });
  if (!captcahVerified) {
    return ctx.except(ExceptionCode.CAPTCHA_ERROR);
  }

  const musicbill = await getMusicbillById(id, [MusicbillProperty.USER_ID]);
  if (!musicbill || musicbill.userId !== ctx.user.id) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  await Promise.all([
    getDB().run(
      `
        DELETE FROM ${MUSICBILL_MUSIC_TABLE_NAME}
        WHERE ${MusicbillMusicProperty.MUSICBILL_ID} = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM ${SHARED_MUSICBILL_TABLE_NAME}
        WHERE ${SharedMusicbillProperty.MUSICBILL_ID} = ?
      `,
      [id],
    ),
  ]);
  await getDB().run(
    `
      DELETE FROM ${MUSICBILL_TABLE_NAME}
      WHERE ${MusicbillProperty.ID} = ?
    `,
    [id],
  );

  return ctx.success(null);
};
