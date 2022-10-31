import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import {
  ALIAS_MAX_LENGTH,
  AllowUpdateKey,
  NAME_MAX_LENGTH,
} from '#/constants/singer';
import exist from '#/utils/exist';
import {
  getSingerById,
  Singer,
  Property as SingerProperty,
  updateSinger,
} from '@/db/singer';
import { saveSingerModifyRecord } from '@/db/singer_modify_record';
import { getAssetPath } from '@/platform/asset';
import { Context } from '../constants';

const ALLOW_UPDATE_KEYS = Object.values(AllowUpdateKey);
const KEY_MAP_HANDLER: Record<
  AllowUpdateKey,
  ({
    ctx,
    singer,
    value,
  }: {
    ctx: Context;
    singer: Pick<
      Singer,
      | SingerProperty.ID
      | SingerProperty.AVATAR
      | SingerProperty.NAME
      | SingerProperty.ALIASES
    >;
    value: unknown;
  }) => Promise<void>
> = {
  [AllowUpdateKey.NAME]: async ({ ctx, singer, value: name }) => {
    if (
      typeof name !== 'string' ||
      !name.length ||
      name.length > NAME_MAX_LENGTH ||
      name.trim() !== name
    ) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }

    if (singer.name === name) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    await Promise.all([
      updateSinger({
        id: singer.id,
        property: SingerProperty.NAME,
        value: name,
      }),
      // saveSingerModifyRecord({
      //   singerId: singer.id,
      //   key: 'name',
      //   value: name,
      //   modifyUserId: ctx.user.id,
      // }),
    ]);

    return ctx.success();
  },
  [AllowUpdateKey.ALIASES]: async ({ ctx, singer, value: aliases }) => {
    if (typeof aliases !== 'string') {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }

    if (singer.aliases === aliases) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    const aliasList = aliases.length ? aliases.split(ALIAS_DIVIDER) : [];

    if (aliasList.length !== Array.from(new Set(aliasList)).length) {
      return ctx.except(ExceptionCode.REPEATED_ALIAS);
    }

    for (const alias of aliasList) {
      if (alias.trim() !== alias) {
        return ctx.except(ExceptionCode.PARAMETER_ERROR);
      }
      if (alias.length > ALIAS_MAX_LENGTH) {
        return ctx.except(ExceptionCode.ALIAS_OVER_MAX_LENGTH);
      }
    }

    await Promise.all([
      updateSinger({
        id: singer.id,
        property: SingerProperty.ALIASES,
        value: aliases,
      }),
      // saveSingerModifyRecord({
      //   singerId: singer.id,
      //   key: 'aliases',
      //   value: aliases,
      //   modifyUserId: ctx.user.id,
      // }),
    ]);

    return ctx.success();
  },
  [AllowUpdateKey.AVATAR]: async ({ ctx, singer, value: avatar }) => {
    if (typeof avatar !== 'string' || !avatar.length) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (singer.avatar === avatar) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    const avatarExist = await exist(
      getAssetPath(avatar, AssetType.SINGER_AVATAR),
    );
    if (!avatarExist) {
      return ctx.except(ExceptionCode.ASSET_NOT_EXIST);
    }

    await Promise.all([
      updateSinger({
        id: singer.id,
        property: SingerProperty.AVATAR,
        value: avatar,
      }),
      // saveSingerModifyRecord({
      //   singerId: singer.id,
      //   key: 'avatar',
      //   value: avatar,
      //   modifyUserId: ctx.user.id,
      // }),
    ]);

    return ctx.success();
  },
};

export default async (ctx: Context) => {
  const { id, key, value } = ctx.request.body as {
    id: unknown;
    key: unknown;
    value: unknown;
  };
  if (
    typeof id !== 'string' ||
    // @ts-expect-error
    !ALLOW_UPDATE_KEYS.includes(key)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const singer = await getSingerById(id, [
    SingerProperty.ID,
    SingerProperty.AVATAR,
    SingerProperty.NAME,
    SingerProperty.ALIASES,
    SingerProperty.CREATE_USER_ID,
  ]);
  if (!singer || singer.createUserId !== ctx.user.id || !ctx.user.super) {
    return ctx.except(ExceptionCode.SINGER_NOT_EXIST);
  }

  // @ts-expect-error
  return KEY_MAP_HANDLER[key]({ ctx, singer, value });
};
