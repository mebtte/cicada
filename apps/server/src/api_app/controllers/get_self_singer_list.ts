import { ALIAS_DIVIDER, AssetType } from '#/constants';
import db from '@/db';
import { Singer, Property } from '@/db/singer';
import { getAssetUrl } from '@/platform/asset';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const singerList = await db.all<
    Pick<
      Singer,
      | Property.ID
      | Property.ALIASES
      | Property.AVATAR
      | Property.CREATE_TIMESTAMP
      | Property.NAME
    >
  >(
    `
      SELECT
        id,
        avatar,
        name,
        aliases,
        createTimestamp
      FROM singer
      WHERE createUserId = ?
      ORDER BY createTimestamp DESC
    `,
    [ctx.user.id],
  );

  return ctx.success(
    singerList.map((s) => ({
      ...s,
      aliases: s.aliases ? s.aliases.split(ALIAS_DIVIDER) : [],
      avatar: getAssetUrl(s.avatar, AssetType.SINGER_AVATAR),
    })),
  );
};
