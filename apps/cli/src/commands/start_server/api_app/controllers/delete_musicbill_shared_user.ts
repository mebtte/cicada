import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById } from '@/db/musicbill';
import {
  MusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbill,
  SharedMusicbillProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { Context } from '../constants';

/**
 * 所有者可以删除任何人
 * 共享者只能删除自己
 * @author mebtte<i@mebtte.com>
 */
export default async (ctx: Context) => {
  const { musicbillId, userId } = ctx.query as {
    musicbillId?: unknown;
    userId?: unknown;
  };
  if (
    typeof musicbillId !== 'string' ||
    !musicbillId.length ||
    typeof userId !== 'string' ||
    !userId.length
  ) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const musicbill = await getMusicbillById(musicbillId, [
    MusicbillProperty.USER_ID,
  ]);
  if (!musicbill) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXISTED);
  }

  if (ctx.user.id !== musicbill.userId && ctx.user.id !== userId) {
    return ctx.except(
      ExceptionCode.NO_PERMISSION_TO_DELETE_MUSICBILL_SHARED_USER,
    );
  }

  const sharedUser = await getDB().get<
    Pick<SharedMusicbill, SharedMusicbillProperty.ID>
  >(
    `
      SELECT
        ${SharedMusicbillProperty.ID}
      FROM ${SHARED_MUSICBILL_TABLE_NAME}
      WHERE ${SharedMusicbillProperty.MUSICBILL_ID} = ?
        AND ${SharedMusicbillProperty.SHARED_USER_ID} = ?
    `,
    [musicbillId, userId],
  );
  if (!sharedUser) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXISTED);
  }

  await getDB().run(
    `
      DELETE FROM ${SHARED_MUSICBILL_TABLE_NAME}
      WHERE ${SharedMusicbillProperty.ID} = ?
    `,
    [sharedUser.id],
  );
  return ctx.success(null);
};
