import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { getUserById, Property as UserProperty } from '@/db/user';
import { getAssetUrl } from '@/platform/asset';
import db from '@/db';
import { Musicbill, Property as MusicbillProperty } from '@/db/musicbill';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: string };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserById(id, [
    UserProperty.ID,
    UserProperty.AVATAR,
    UserProperty.EMAIL,
    UserProperty.JOIN_TIMESTAMP,
    UserProperty.NICKNAME,
  ]);
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXIST);
  }

  const [publicMusicbillList] = await Promise.all([
    db.all<
      Pick<
        Musicbill,
        | MusicbillProperty.ID
        | MusicbillProperty.COVER
        | MusicbillProperty.NAME
        | MusicbillProperty.CREATE_TIMESTAMP
      >
    >(
      `
        select ${[
          MusicbillProperty.ID,
          MusicbillProperty.COVER,
          MusicbillProperty.NAME,
          MusicbillProperty.CREATE_TIMESTAMP,
        ].join(',')} from musicbill
        where ${MusicbillProperty.USER_ID} = ?
          and ${MusicbillProperty.PUBLIC} = 1
        order by ${MusicbillProperty.CREATE_TIMESTAMP} DESC
      `,
      [id],
    ),
  ]);

  return ctx.success({
    ...user,
    avatar: getAssetUrl(user.avatar, AssetType.USER_AVATAR),
    musicbillList: publicMusicbillList.map((m) => ({
      ...m,
      cover: getAssetUrl(m.cover, AssetType.MUSICBILL_COVER),
    })),
  });
};
