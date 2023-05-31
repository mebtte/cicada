import { ExceptionCode } from '#/constants/exception';
import { Response } from '#/server/api/get_musicbill_shared_user_list';
import { getMusicbillById } from '@/db/musicbill';
import {
  MusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbill,
  SharedMusicbillProperty,
  UserProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getUserListByIds } from '@/db/user';
import { getAssetPublicPath } from '@/platform/asset';
import { AssetType, MusicbillSharedUserStatus } from '#/constants';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: unknown };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(id, [MusicbillProperty.USER_ID]);
  if (!musicbill) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }
  const sharedUserList = await getDB().all<
    Pick<
      SharedMusicbill,
      SharedMusicbillProperty.SHARED_USER_ID | SharedMusicbillProperty.ACCEPTED
    >
  >(
    `
      SELECT
        ${SharedMusicbillProperty.SHARED_USER_ID},
        ${SharedMusicbillProperty.ACCEPTED}
      FROM ${SHARED_MUSICBILL_TABLE_NAME}
      WHERE ${SharedMusicbillProperty.MUSICBILL_ID} = ?
    `,
    [id],
  );
  const sharedUser = sharedUserList.find((u) => u.sharedUserId === ctx.user.id);
  if (
    musicbill.userId !== ctx.user.id &&
    (!sharedUser || sharedUser.accepted === 0)
  ) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const userList = await getUserListByIds(
    [musicbill.userId, ...sharedUserList.map((u) => u.sharedUserId)],
    [UserProperty.ID, UserProperty.NICKNAME, UserProperty.AVATAR],
  );
  return ctx.success<Response>(
    userList.map((u) => ({
      ...u,
      avatar: getAssetPublicPath(u.avatar, AssetType.USER_AVATAR),
      status:
        u.id === musicbill.userId
          ? MusicbillSharedUserStatus.OWNER
          : sharedUserList.find((su) => su.sharedUserId === u.id)!.accepted
          ? MusicbillSharedUserStatus.ACCEPTED
          : MusicbillSharedUserStatus.INVITED,
    })),
  );
};
