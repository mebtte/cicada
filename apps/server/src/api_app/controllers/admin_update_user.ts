import { ExceptionCode } from '#/constants/exception';
import { AdminAllowUpdateKey, REMARK_MAX_LENGTH } from '#/constants/user';
import {
  User,
  Property as UserProperty,
  getUserById,
  updateUser,
} from '@/db/user';
import { Context } from '../constants';

type LocalUser = Pick<
  User,
  UserProperty.ID | UserProperty.REMARK | UserProperty.ADMIN
>;

const KEY_MAP_HANDLER: Record<
  AdminAllowUpdateKey,
  (data: { ctx: Context; user: LocalUser; value: unknown }) => Promise<void>
> = {
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
  [AdminAllowUpdateKey.ADMIN]: async ({ ctx, user }) => {
    if (user.admin === 1) {
      return ctx.success(ExceptionCode.NO_NEED_TO_UPDATE);
    }
    await updateUser({ id: user.id, property: UserProperty.ADMIN, value: 1 });
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
    UserProperty.ADMIN,
  ]);
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXIST);
  }

  return KEY_MAP_HANDLER[key as AdminAllowUpdateKey]({ ctx, user, value });
};
