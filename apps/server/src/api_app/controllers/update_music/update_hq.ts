import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import exist from '#/utils/exist';
import { getAssetFilePath } from '@/platform/asset';
import { updateMusic, Property as MusicProperty } from '@/db/music';
import { saveMusicModifyRecord } from '@/db/music_modify_record';
import { AllowUpdateKey } from '#/constants/music';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (typeof value !== 'string' || !value.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }
  if (music.hq === value) {
    return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
  }
  const assetExist = await exist(getAssetFilePath(value, AssetType.MUSIC_HQ));
  if (!assetExist) {
    return ctx.except(ExceptionCode.ASSET_NOT_EXIST);
  }
  await Promise.all([
    updateMusic({ id: music.id, property: MusicProperty.HQ, value }),
    saveMusicModifyRecord({
      modifyUserId: ctx.user.id,
      musicId: music.id,
      key: AllowUpdateKey.HQ,
    }),
  ]);
  return ctx.success();
};
