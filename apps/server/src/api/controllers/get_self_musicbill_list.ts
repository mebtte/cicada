import { AssetType } from '#/constants';
import { getUserMusicbillList, Property } from '@/db/musicbill';
import { getUserMusicbillOrders } from '@/db/user_musicbill_order';
import { getAssetUrl } from '@/platform/asset';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const [musicbillList, orders] = await Promise.all([
    getUserMusicbillList(ctx.user.id, [
      Property.ID,
      Property.COVER,
      Property.NAME,
      Property.PUBLIC,
      Property.CREATE_TIMESTAMP,
    ]),
    getUserMusicbillOrders(ctx.user.id),
  ]);
  return ctx.success(
    musicbillList
      .map((mb) => ({
        ...mb,
        cover: getAssetUrl(mb.cover, AssetType.MUSICBILL_COVER),
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
