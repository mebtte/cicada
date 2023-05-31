import { ExceptionCode } from '#/constants/exception';
import { EMAIL } from '#/constants/regexp';
import { getMusicbillById } from '@/db/musicbill';
import {
  MusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbill,
  SharedMusicbillProperty,
  UserProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getUserByEmail } from '@/db/user';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { musicbillId, email } = ctx.request.body as {
    musicbillId?: unknown;
    email?: unknown;
  };
  if (
    typeof musicbillId !== 'string' ||
    !musicbillId.length ||
    typeof email !== 'string' ||
    !EMAIL.test(email)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(musicbillId, [
    MusicbillProperty.USER_ID,
  ]);
  if (!musicbill) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const [sharedUserList, user] = await Promise.all([
    getDB().all<
      Pick<
        SharedMusicbill,
        | SharedMusicbillProperty.SHARED_USER_ID
        | SharedMusicbillProperty.ACCEPTED
      >
    >(
      `
        SELECT
          ${SharedMusicbillProperty.SHARED_USER_ID},
          ${SharedMusicbillProperty.ACCEPTED}
        FROM ${SHARED_MUSICBILL_TABLE_NAME}
        WHERE ${SharedMusicbillProperty.MUSICBILL_ID} = ?
      `,
      [musicbillId],
    ),
    getUserByEmail(email, [UserProperty.ID]),
  ]);

  if (
    musicbill.userId !== ctx.user.id &&
    !sharedUserList.find((u) => u.sharedUserId === ctx.user.id && u.accepted)
  ) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXIST);
  }
  if (musicbill.userId === user.id) {
    return ctx.except(ExceptionCode.SHARED_MUSICBILL_CAN_NOT_INVITE_OWNER);
  }
  if (sharedUserList.find((u) => u.sharedUserId === musicbill.userId)) {
    return ctx.except(ExceptionCode.SHARED_MUSICBILL_CAN_NOT_INVITE_REPEATLY);
  }

  await getDB().run(
    `
      INSERT INTO ${SHARED_MUSICBILL_TABLE_NAME} ( ${SharedMusicbillProperty.MUSICBILL_ID}, ${SharedMusicbillProperty.SHARED_USER_ID}, ${SharedMusicbillProperty.SHARE_TIMESTAMP}, ${SharedMusicbillProperty.INVITE_USER_ID} )
      VALUES ( ?, ?, ?, ? )
    `,
    [musicbillId, user.id, Date.now(), ctx.user.id],
  );
  return ctx.success(null);
};
