import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById } from '@/db/musicbill';
import {
  MusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbill,
  SharedMusicbillProperty,
  UserProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import getUserByUsername from '@/db/get_user_by_username';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { musicbillId, username } = ctx.request.body as {
    musicbillId?: unknown;
    username?: unknown;
  };
  if (
    typeof musicbillId !== 'string' ||
    !musicbillId.length ||
    typeof username !== 'string' ||
    !username.length
  ) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const musicbill = await getMusicbillById(musicbillId, [
    MusicbillProperty.USER_ID,
  ]);
  if (!musicbill) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXISTED);
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
    getUserByUsername(username, [UserProperty.ID]),
  ]);

  if (
    musicbill.userId !== ctx.user.id &&
    !sharedUserList.find((u) => u.sharedUserId === ctx.user.id && u.accepted)
  ) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXISTED);
  }
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXISTED);
  }
  if (musicbill.userId === user.id) {
    return ctx.except(ExceptionCode.CAN_NOT_INVITE_MUSICBILL_OWNER);
  }
  if (sharedUserList.find((u) => u.sharedUserId === musicbill.userId)) {
    return ctx.except(ExceptionCode.REPEATED_SHARED_MUSICBILL_INVITATION);
  }

  await getDB().run(
    `
      INSERT INTO ${SHARED_MUSICBILL_TABLE_NAME} ( ${SharedMusicbillProperty.MUSICBILL_ID}, ${SharedMusicbillProperty.SHARED_USER_ID}, ${SharedMusicbillProperty.INVITE_TIMESTAMP}, ${SharedMusicbillProperty.INVITE_USER_ID} )
      VALUES ( ?, ?, ?, ? )
    `,
    [musicbillId, user.id, Date.now(), ctx.user.id],
  );
  return ctx.success(null);
};
