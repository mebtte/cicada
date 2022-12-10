import { AssetType } from '#/constants';
import { getUserMusicbillList, Property } from '@/db/musicbill';
import { getAssetPublicPath } from '@/platform/asset';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const musicbillList = await getUserMusicbillList(ctx.user.id, [
    Property.ID,
    Property.COVER,
    Property.NAME,
    Property.PUBLIC,
    Property.CREATE_TIMESTAMP,
  ]);

  const orders: string[] = ctx.user.musicbillOrdersJSON
    ? JSON.parse(ctx.user.musicbillOrdersJSON)
    : [];

  return ctx.success(
    musicbillList
      .map((mb) => ({
        ...mb,
        cover: getAssetPublicPath(mb.cover, AssetType.MUSICBILL_COVER),
      }))
      .sort((a, b) => {
        const aOrder = orders.indexOf(a.id);
        const bOrder = orders.indexOf(b.id);
        return (
          (aOrder === -1 ? Infinity : aOrder) -
          (bOrder === -1 ? Infinity : bOrder)
        );
      }),
  );
};
