import { ExceptionCode } from '#/constants/exception';
import { getDB } from '@/db';
import {
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbill,
  SharedMusicbillProperty,
} from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.request.body as { id?: unknown };
  if (typeof id !== 'number') {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const sharedMusicbillInvitation = await getDB().get<
    Pick<SharedMusicbill, SharedMusicbillProperty.SHARED_USER_ID>
  >(
    `
      SELECT
        ${SharedMusicbillProperty.ID}
      FROM ${SHARED_MUSICBILL_TABLE_NAME}
      WHERE ${SharedMusicbillProperty.ID} = ?
        AND ${SharedMusicbillProperty.ACCEPTED} = 0
        AND ${SharedMusicbillProperty.SHARED_USER_ID} = ?
    `,
    [id, ctx.user.id],
  );
  if (!sharedMusicbillInvitation) {
    return ctx.except(ExceptionCode.SHARED_MUSICBILL_INVITATION_NOT_EXISTED);
  }

  await getDB().run(
    `
      UPDATE ${SHARED_MUSICBILL_TABLE_NAME} SET ${SharedMusicbillProperty.ACCEPTED} = 1
      WHERE ${SharedMusicbillProperty.ID} = ?
    `,
    [id],
  );
  return ctx.success(null);
};
