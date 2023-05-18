import { ExceptionCode } from '#/constants/exception';
import { EMAIL } from '#/constants/regexp';
import { AdminAllowUpdateKey, REMARK_MAX_LENGTH } from '#/constants/user';
import { User, UserProperty } from '@/constants/db_definition';
import { getUserById } from '@/db/user';
import updateUser from '@/db/update_user';
import { Context } from '../constants';

type LocalUser = Pick<
  User,
  | UserProperty.ID
  | UserProperty.REMARK
  | UserProperty.EMAIL
  | UserProperty.MUSICBILL_MAX_AMOUNT
  | UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY
  | UserProperty.EXPORT_MUSICBILL_MAX_TIME_PER_DAY
  | UserProperty.MUSIC_PLAY_RECORD_INDATE
>;

const KEY_MAP_HANDLER: Record<
  AdminAllowUpdateKey,
  (data: { ctx: Context; user: LocalUser; value: unknown }) => Promise<void>
> = {
  [AdminAllowUpdateKey.EMAIL]: async ({ ctx, user, value }) => {
    if (typeof value !== 'string' || !EMAIL.test(value)) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (user.email === value) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    await updateUser({
      id: user.id,
      property: UserProperty.EMAIL,
      value,
    });

    return ctx.success();
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

    return ctx.success();
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

    return ctx.success();
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

    return ctx.success();
  },
  [AdminAllowUpdateKey.EXPORT_MUSICBILL_MAX_TIME_PER_DAY]: async ({
    ctx,
    user,
    value,
  }) => {
    if (typeof value !== 'number' || value < 0) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }
    if (user.exportMusicbillMaxTimePerDay === value) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    await updateUser({
      id: user.id,
      property: UserProperty.EXPORT_MUSICBILL_MAX_TIME_PER_DAY,
      value,
    });

    return ctx.success();
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
    !id.length ||
    // @ts-expect-error
    !Object.values(AdminAllowUpdateKey).includes(key)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user: LocalUser | null = await getUserById(id, [
    UserProperty.ID,
    UserProperty.REMARK,
    UserProperty.EMAIL,
    UserProperty.MUSICBILL_MAX_AMOUNT,
    UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY,
    UserProperty.EXPORT_MUSICBILL_MAX_TIME_PER_DAY,
    UserProperty.MUSIC_PLAY_RECORD_INDATE,
  ]);
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXIST);
  }

  return KEY_MAP_HANDLER[key as AdminAllowUpdateKey]({ ctx, user, value });
};
