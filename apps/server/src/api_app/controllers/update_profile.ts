import { AssetTypeV1 } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { AllowUpdateKey, NICKNAME_MAX_LENGTH } from '#/constants/user';
import exist from '#/utils/exist';
import { User, UserProperty } from '@/constants/db_definition';
import { getDB } from '@/db';
import {
  getMusicbillListByIds,
  Property as MusicbillProperty,
} from '@/db/musicbill';
import { updateUser } from '@/db/user';
import { getAssetFilePath } from '@/platform/asset';
import { Context } from '../constants';

const ALLOW_UPDATE_KEYS = Object.values(AllowUpdateKey);
const KEY_MAP_HANDLER: Record<
  AllowUpdateKey,
  ({ ctx, value }: { ctx: Context; value: unknown }) => Promise<void>
> = {
  [AllowUpdateKey.AVATAR]: async ({ ctx, value: avatar }) => {
    if (typeof avatar !== 'string' || !avatar.length) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (ctx.user.avatar === avatar) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }
    const avatarExist = await exist(
      getAssetFilePath(avatar, AssetTypeV1.USER_AVATAR),
    );
    if (!avatarExist) {
      return ctx.except(ExceptionCode.ASSET_NOT_EXIST);
    }
    await updateUser({
      id: ctx.user.id,
      property: UserProperty.AVATAR,
      value: avatar,
    });
    return ctx.success();
  },
  [AllowUpdateKey.NICKNAME]: async ({ ctx, value: nickname }) => {
    if (
      typeof nickname !== 'string' ||
      !nickname.length ||
      nickname.length > NICKNAME_MAX_LENGTH ||
      nickname.trim() !== nickname
    ) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (ctx.user.nickname === nickname) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    const nicknameUser = await getDB().get<Pick<User, UserProperty.ID>>(
      `
        select id from user where nickname = ?
      `,
      [nickname],
    );
    if (nicknameUser) {
      return ctx.except(ExceptionCode.NICKNAME_EXIST);
    }

    await updateUser({
      id: ctx.user.id,
      property: UserProperty.NICKNAME,
      value: nickname,
    });

    return ctx.success();
  },
  [AllowUpdateKey.MUSICBILL_ORDERS]: async ({ ctx, value: orders }) => {
    if (
      !orders ||
      !(orders instanceof Array) ||
      !orders.length ||
      orders.find((o) => typeof o !== 'string')
    ) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }

    const musicbillList = await getMusicbillListByIds(orders, [
      MusicbillProperty.USER_ID,
    ]);
    if (musicbillList.length !== orders.length) {
      return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
    }
    const notUserMusicbill = musicbillList.find(
      (m) => m.userId !== ctx.user.id,
    );
    if (notUserMusicbill) {
      return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
    }

    await updateUser({
      id: ctx.user.id,
      property: UserProperty.MUSICBILL_ORDERS_JSON,
      value: JSON.stringify(orders),
    });

    return ctx.success();
  },
};

export default async (ctx: Context) => {
  const { key, value } = ctx.request.body as { key: unknown; value: unknown };
  // @ts-expect-error
  if (!ALLOW_UPDATE_KEYS.includes(key)) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }
  // @ts-expect-error
  return KEY_MAP_HANDLER[key]({ ctx, value });
};
