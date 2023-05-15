import { AssetType } from '#/constants';
import { getUserMusicbillList } from '@/db/musicbill';
import { getAssetPublicPath } from '@/platform/asset';
import { MusicbillProperty } from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const musicbillList = await getUserMusicbillList(ctx.user.id, [
    MusicbillProperty.ID,
    MusicbillProperty.COVER,
    MusicbillProperty.NAME,
    MusicbillProperty.PUBLIC,
    MusicbillProperty.CREATE_TIMESTAMP,
  ]);

  return ctx.success(
    musicbillList.map((mb) => ({
      ...mb,
      cover: getAssetPublicPath(mb.cover, AssetType.MUSICBILL_COVER),
    })),
  );
};
