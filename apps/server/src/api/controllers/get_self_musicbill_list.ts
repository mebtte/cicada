import { AssetType } from '#/constants';
import { getUserMusicbillList, Property } from '@/db/musicbill';
import { getAssetUrl } from '@/platform/asset';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const musicbillList = await getUserMusicbillList(ctx.user.id, [
    Property.ID,
    Property.COVER,
    Property.NAME,
    Property.PUBLIC,
    Property.ORDER,
    Property.ORDER_TIMESTAMP,
    Property.CREATE_TIMESTAMP,
  ]);
  return ctx.success(
    musicbillList.map((mb) => ({
      ...mb,
      cover: getAssetUrl(mb.cover, AssetType.MUSICBILL_COVER),
    })),
  );
};
