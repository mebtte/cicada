import fs from 'fs/promises';
import { ExceptionCode } from '#/constants/exception';
import {
  getMusicbillById,
  Property as MusicbillProperty,
  updateMusicbill,
} from '@/db/musicbill';
import { getAssetPath } from '@/platform/asset';
import { AssetType } from '#/constants';
import { NAME_MAX_LENGTH } from '#/constants/musicbill';
import { Context } from '../constants';

const ALLOW_UPDATE_PROPERTIES = [
  MusicbillProperty.COVER,
  MusicbillProperty.NAME,
  MusicbillProperty.PUBLIC,
] as const;

export default async (ctx: Context) => {
  const { id, key, value } = ctx.request.body as {
    id?: string;
    key?: MusicbillProperty;
    value?: unknown;
  };
  if (
    typeof id !== 'string' ||
    !id.length ||
    // @ts-expect-error
    !ALLOW_UPDATE_PROPERTIES.includes(key)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(id, [
    MusicbillProperty.USER_ID,
    MusicbillProperty.COVER,
    MusicbillProperty.NAME,
    MusicbillProperty.PUBLIC,
  ]);
  if (!musicbill || musicbill.userId !== ctx.user.id) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  switch (key) {
    case MusicbillProperty.COVER: {
      if (typeof value !== 'string') {
        return ctx.except(ExceptionCode.PARAMETER_ERROR);
      }
      if (musicbill.cover === value) {
        return ctx.except(ExceptionCode.MUSICBILL_DO_NOT_NEED_TO_UPDATE);
      }
      if (value.length) {
        const assetExist = await fs
          .access(getAssetPath(value, AssetType.MUSICBILL_COVER))
          .then(() => true)
          .catch(() => false);
        if (!assetExist) {
          return ctx.except(ExceptionCode.ASSET_NOT_EXIST);
        }
      }
      await updateMusicbill(id, MusicbillProperty.COVER, value);

      break;
    }

    case MusicbillProperty.NAME: {
      if (
        typeof value !== 'string' ||
        !value.length ||
        value.length > NAME_MAX_LENGTH ||
        value.replace(/\s/g, '') !== value
      ) {
        return ctx.except(ExceptionCode.PARAMETER_ERROR);
      }
      if (musicbill.name === value) {
        return ctx.except(ExceptionCode.MUSICBILL_DO_NOT_NEED_TO_UPDATE);
      }
      await updateMusicbill(id, MusicbillProperty.NAME, value);

      break;
    }

    case MusicbillProperty.PUBLIC: {
      if (typeof value !== 'boolean') {
        return ctx.except(ExceptionCode.PARAMETER_ERROR);
      }
      if (musicbill.public === (value ? 1 : 0)) {
        return ctx.except(ExceptionCode.MUSICBILL_DO_NOT_NEED_TO_UPDATE);
      }
      await updateMusicbill(id, MusicbillProperty.PUBLIC, value ? 1 : 0);

      break;
    }
  }

  return ctx.success();
};
