import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import {
  ALIAS_MAX_LENGTH,
  AllowUpdateKey,
  NAME_MAX_LENGTH,
  SINGER_ALIAS_MAX_COUNT,
} from '#/constants/singer';
import exist from '#/utils/exist';
import {
  getSingerById,
  Singer,
  Property as SingerProperty,
  updateSinger,
} from '@/db/singer';
import { saveSingerModifyRecord } from '@/db/singer_modify_record';
import { getAssetFilePath } from '@/platform/asset';
import { Context } from '../constants';

type LocalSinger = Pick<
  Singer,
  | SingerProperty.ID
  | SingerProperty.AVATAR
  | SingerProperty.NAME
  | SingerProperty.ALIASES
  | SingerProperty.CREATE_USER_ID
>;
const ALLOW_UPDATE_KEYS = Object.values(AllowUpdateKey);
const KEY_MAP_HANDLER: Record<
  AllowUpdateKey,
  ({
    ctx,
    singer,
    value,
  }: {
    ctx: Context;
    singer: LocalSinger;
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
      saveSingerModifyRecord({
        singerId: singer.id,
        key: AllowUpdateKey.NAME,
        modifyUserId: ctx.user.id,
      }),
    ]);

    return ctx.success();
  },
  [AllowUpdateKey.ALIASES]: async ({ ctx, singer, value }) => {
    if (
      !Array.isArray(value) ||
      value.length > SINGER_ALIAS_MAX_COUNT ||
      value.find((a) => typeof a !== 'string' || a.length > ALIAS_MAX_LENGTH)
    ) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }

    const trimmedAliases: string[] = value.map((v) =>
      v.replace(/\s+/g, ' ').trim(),
    );
    if (trimmedAliases.find((a) => a.length === 0)) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }

    const aliases = value.join(ALIAS_DIVIDER);
    if (singer.aliases === aliases) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    await Promise.all([
      updateSinger({
        id: singer.id,
        property: SingerProperty.ALIASES,
        value: aliases,
      }),
      saveSingerModifyRecord({
        singerId: singer.id,
        key: AllowUpdateKey.ALIASES,
        modifyUserId: ctx.user.id,
      }),
    ]);

    return ctx.success();
  },
  [AllowUpdateKey.AVATAR]: async ({ ctx, singer, value: avatar }) => {
    if (typeof avatar !== 'string') {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (singer.avatar === avatar) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    if (avatar.length) {
      const avatarExist = await exist(
        getAssetFilePath(avatar, AssetType.SINGER_AVATAR),
      );
      if (!avatarExist) {
        return ctx.except(ExceptionCode.ASSET_NOT_EXIST);
      }
    }

    await Promise.all([
      updateSinger({
        id: singer.id,
        property: SingerProperty.AVATAR,
        value: avatar,
      }),
      saveSingerModifyRecord({
        singerId: singer.id,
        key: AllowUpdateKey.AVATAR,
        modifyUserId: ctx.user.id,
      }),
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

  const singer: LocalSinger | null = await getSingerById(id, [
    SingerProperty.ID,
    SingerProperty.AVATAR,
    SingerProperty.NAME,
    SingerProperty.ALIASES,
    SingerProperty.CREATE_USER_ID,
  ]);
  if (!singer || (singer.createUserId !== ctx.user.id && !ctx.user.admin)) {
    return ctx.except(ExceptionCode.SINGER_NOT_EXIST);
  }

  // @ts-expect-error
  return KEY_MAP_HANDLER[key]({ ctx, singer, value });
};
