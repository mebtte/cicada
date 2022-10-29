import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import exist from '#/utils/exist';
import { getAssetPath } from '@/platform/asset';
import { updateMusic, Property as MusicProperty } from '@/db/music';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (typeof value !== 'string' || !value.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }
  if (music.cover === value) {
    return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
  }
  const assetExist = await exist(getAssetPath(value, AssetType.MUSIC_COVER));
  if (!assetExist) {
    return ctx.except(ExceptionCode.ASSET_NOT_EXIST);
  }
  await updateMusic({ id: music.id, property: MusicProperty.COVER, value });
  return ctx.success();
};
