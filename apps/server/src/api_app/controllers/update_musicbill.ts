import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById, updateMusicbill } from '@/db/musicbill';
import { getAssetFilePath } from '@/platform/asset';
import { AssetType } from '#/constants';
import { AllowUpdateKey, NAME_MAX_LENGTH } from '#/constants/musicbill';
import exist from '#/utils/exist';
import { Musicbill, MusicbillProperty } from '@/constants/db_definition';
import { Context } from '../constants';

const ALLOW_UPDATE_KEYS = Object.values(AllowUpdateKey);
const KEY_MAP_HANDLER: Record<
  AllowUpdateKey,
  ({
    ctx,
    musicbill,
    value,
  }: {
    ctx: Context;
    musicbill: Pick<
      Musicbill,
      | MusicbillProperty.ID
      | MusicbillProperty.NAME
      | MusicbillProperty.COVER
      | MusicbillProperty.PUBLIC
    >;
    value: unknown;
  }) => Promise<void>
> = {
  [AllowUpdateKey.NAME]: async ({ ctx, musicbill, value: name }) => {
    if (
      typeof name !== 'string' ||
      !name.length ||
      name.length > NAME_MAX_LENGTH ||
      name.replace(/\s+/g, ' ').trim() !== name
    ) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (musicbill.name === name) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }
    await updateMusicbill(musicbill.id, MusicbillProperty.NAME, name);
    return ctx.success();
  },
  [AllowUpdateKey.COVER]: async ({ ctx, musicbill, value: cover }) => {
    if (typeof cover !== 'string' || !cover.length) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (musicbill.cover === cover) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }
    const assetExist = await exist(
      getAssetFilePath(cover, AssetType.MUSICBILL_COVER),
    );
    if (!assetExist) {
      return ctx.except(ExceptionCode.ASSET_NOT_EXIST);
    }
    await updateMusicbill(musicbill.id, MusicbillProperty.COVER, cover);
    return ctx.success();
  },
  [AllowUpdateKey.PUBLIC]: async ({ ctx, musicbill, value: publiz }) => {
    if (typeof publiz !== 'boolean') {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (musicbill.public === (publiz ? 1 : 0)) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }
    await updateMusicbill(
      musicbill.id,
      MusicbillProperty.PUBLIC,
      publiz ? 1 : 0,
    );
    return ctx.success();
  },
};

export default async (ctx: Context) => {
  const { id, key, value } = ctx.request.body as {
    id?: string;
    key?: string;
    value?: unknown;
  };
  if (
    typeof id !== 'string' ||
    !id.length ||
    !key ||
    // @ts-expect-error
    !ALLOW_UPDATE_KEYS.includes(key)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(id, [
    MusicbillProperty.ID,
    MusicbillProperty.USER_ID,
    MusicbillProperty.COVER,
    MusicbillProperty.NAME,
    MusicbillProperty.PUBLIC,
  ]);
  if (!musicbill || musicbill.userId !== ctx.user.id) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  return KEY_MAP_HANDLER[key]({ ctx, musicbill, value });
};
