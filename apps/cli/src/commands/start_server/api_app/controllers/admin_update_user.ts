import { ExceptionCode } from '#/constants/exception';
import {
  AdminAllowUpdateKey,
  PASSWORD_MAX_LENGTH,
  REMARK_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '#/constants/user';
import { User, UserProperty } from '@/constants/db_definition';
import { getUserById } from '@/db/user';
import updateUser from '@/db/update_user';
import getUserByUsername from '@/db/get_user_by_username';
import md5 from 'md5';
import generateRandomString from '#/utils/generate_random_string';
import { TOKEN_IDENTIFIER_LENGTH } from '@/constants';
import { Context } from '../constants';

type LocalUser = Pick<
  User,
  | UserProperty.ID
  | UserProperty.REMARK
  | UserProperty.USERNAME
  | UserProperty.MUSICBILL_MAX_AMOUNT
  | UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY
  | UserProperty.MUSIC_PLAY_RECORD_INDATE
>;

const KEY_MAP_HANDLER: Record<
  AdminAllowUpdateKey,
  (data: { ctx: Context; user: LocalUser; value: unknown }) => Promise<void>
> = {
  [AdminAllowUpdateKey.PASSWORD]: async ({ ctx, user, value }) => {
    if (
      typeof value !== 'string' ||
      !value.length ||
      value.length > PASSWORD_MAX_LENGTH
    ) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }

    await Promise.all([
      updateUser({
        id: user.id,
        property: UserProperty.PASSWORD,
        value: md5(md5(value)),
      }),
      updateUser({
        id: user.id,
        property: UserProperty.TOKEN_IDENTIFIER,
        value: generateRandomString(TOKEN_IDENTIFIER_LENGTH),
      }),
    ]);
    return ctx.success(null);
  },
  [AdminAllowUpdateKey.USERNAME]: async ({ ctx, user, value }) => {
    if (
      typeof value !== 'string' ||
      !value.length ||
      value.length > USERNAME_MAX_LENGTH
    ) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (user.username === value) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    const existedUsername = await getUserByUsername(value, [UserProperty.ID]);
    if (existedUsername) {
      return ctx.except(ExceptionCode.USERNAME_ALREADY_REGISTERED);
    }

    await updateUser({
      id: user.id,
      property: UserProperty.USERNAME,
      value,
    });
    return ctx.success(null);
  },
  [AdminAllowUpdateKey.REMARK]: async ({ ctx, user, value }) => {
    if (typeof value !== 'string' || value.length > REMARK_MAX_LENGTH) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (user.remark === value) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    await updateUser({
      id: user.id,
      property: UserProperty.REMARK,
      value,
    });

    return ctx.success(null);
  },
  [AdminAllowUpdateKey.MUSICBILL_MAX_AMOUNT]: async ({ ctx, user, value }) => {
    if (typeof value !== 'number' || value < 0) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (user.musicbillMaxAmount === value) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    await updateUser({
      id: user.id,
      property: UserProperty.MUSICBILL_MAX_AMOUNT,
      value,
    });

    return ctx.success(null);
  },
  [AdminAllowUpdateKey.CREATE_MUSIC_MAX_AMOUNT_PER_DAY]: async ({
    ctx,
    user,
    value,
  }) => {
    if (typeof value !== 'number' || value < 0) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (user.createMusicMaxAmountPerDay === value) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    await updateUser({
      id: user.id,
      property: UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY,
      value,
    });

    return ctx.success(null);
  },
  [AdminAllowUpdateKey.MUSIC_PLAY_RECORD_INDATE]: async ({
    ctx,
    user,
    value,
  }) => {
    if (typeof value !== 'number' || value < 0) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (user.musicPlayRecordIndate === value) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    await updateUser({
      id: user.id,
      property: UserProperty.MUSIC_PLAY_RECORD_INDATE,
      value,
    });

    return ctx.success(null);
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
    !id.length ||
    // @ts-expect-error
    !Object.values(AdminAllowUpdateKey).includes(key)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user: LocalUser | null = await getUserById(id, [
    UserProperty.ID,
    UserProperty.REMARK,
    UserProperty.USERNAME,
    UserProperty.MUSICBILL_MAX_AMOUNT,
    UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY,
    UserProperty.MUSIC_PLAY_RECORD_INDATE,
  ]);
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXISTED);
  }

  return KEY_MAP_HANDLER[key as AdminAllowUpdateKey]({ ctx, user, value });
};
