import { ExceptionCode } from '#/constants/exception';
import { getUserById } from '@/db/user';
import { getDB } from '@/db';
import { UserProperty } from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id, captchaId, captchaValue } = ctx.query as {
    id?: unknown;
    captchaId?: unknown;
    captchaValue?: string;
  };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserById(id, Object.values(UserProperty));
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXIST);
  }

  const [loginCodeList, lyricList] = await Promise.all([
    getDB().all(
      `
        SELECT * FROM login_code
        WHERE userId = ?
      `,
      [id],
    ),
    getDB().all(
      `
        SELECT l.* FROM lyric AS l
        LEFT JOIN music as m
          ON l.musicId = m.id
        WHERE m.createUserId = ?
      `,
      [id],
    ),
  ]);
};
