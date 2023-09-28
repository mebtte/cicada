import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import {
  AllowUpdateKey,
  NICKNAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '#/constants/user';
import exist from '#/utils/exist';
import {
  MUSICBILL_TABLE_NAME,
  Musicbill,
  MusicbillProperty,
  USER_TABLE_NAME,
  User,
  UserProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getAssetFilePath } from '@/platform/asset';
import updateUser from '@/db/update_user';
import md5 from 'md5';
import generateRandomString from '#/utils/generate_random_string';
import { TOKEN_IDENTIFIER_LENGTH } from '@/constants';
import { Context } from '../constants';

const ALLOW_UPDATE_KEYS = Object.values(AllowUpdateKey);
const KEY_MAP_HANDLER: Record<
  AllowUpdateKey,
  ({ ctx, value }: { ctx: Context; value: unknown }) => Promise<void>
> = {
  [AllowUpdateKey.PASSWORD]: async ({ ctx, value: password }) => {
    if (
      typeof password !== 'string' ||
      !password.length ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    await Promise.all([
      updateUser({
        id: ctx.user.id,
        property: UserProperty.PASSWORD,
        value: md5(md5(password)),
      }),
      updateUser({
        id: ctx.user.id,
        property: UserProperty.TOKEN_IDENTIFIER,
        value: generateRandomString(TOKEN_IDENTIFIER_LENGTH),
      }),
    ]);
    return ctx.success(null);
  },
  [AllowUpdateKey.AVATAR]: async ({ ctx, value: avatar }) => {
    if (typeof avatar !== 'string' || !avatar.length) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (ctx.user.avatar === avatar) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }
    const avatarExist = await exist(
      getAssetFilePath(avatar, AssetType.USER_AVATAR),
    );
    if (!avatarExist) {
      return ctx.except(ExceptionCode.ASSET_NOT_EXISTED);
    }
    await updateUser({
      id: ctx.user.id,
      property: UserProperty.AVATAR,
      value: avatar,
    });
    return ctx.success(null);
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
        SELECT
          ${UserProperty.ID}
        FROM ${USER_TABLE_NAME}
        WHERE ${UserProperty.NICKNAME} = ?
      `,
      [nickname],
    );
    if (nicknameUser) {
      return ctx.except(ExceptionCode.NICKNAME_HAS_USED_BY_OTHERS);
    }

    await updateUser({
      id: ctx.user.id,
      property: UserProperty.NICKNAME,
      value: nickname,
    });

    return ctx.success(null);
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

    const existMusicbillList = await getDB().all<
      Pick<Musicbill, MusicbillProperty.ID>
    >(
      `
        SELECT
          ${MusicbillProperty.ID}
        FROM ${MUSICBILL_TABLE_NAME}
        WHERE ${MusicbillProperty.ID} IN ( ${orders.map(() => '?').join(', ')} )
      `,
      orders,
    );
    if (orders.length > existMusicbillList.length) {
      return ctx.except(ExceptionCode.MUSICBILL_NOT_EXISTED);
    }

    await updateUser({
      id: ctx.user.id,
      property: UserProperty.MUSICBILL_ORDERS_JSON,
      value: JSON.stringify(orders),
    });

    return ctx.success(null);
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
