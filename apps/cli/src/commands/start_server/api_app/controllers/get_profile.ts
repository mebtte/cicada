import { UserProperty } from '@/constants/db_definition';
import updateUser from '@/db/update_user';
import logger from '@/utils/logger';
import { Response } from '#/server/api/get_profile';
import { Context } from '../constants';

export default async (ctx: Context) => {
  updateUser({
    id: ctx.user.id,
    property: UserProperty.LAST_ACTIVE_TIMESTAMP,
    value: Date.now(),
  }).catch((error) =>
    logger.error({
      label: 'api',
      title: 'update user last_active_timestamp',
      error,
    }),
  );
  return ctx.success<Response>({
    id: ctx.user.id,
    username: ctx.user.username,
    avatar: ctx.user.avatar,
    nickname: ctx.user.nickname,
    joinTimestamp: ctx.user.joinTimestamp,
    admin: ctx.user.admin,
    musicbillOrdersJSON: ctx.user.musicbillOrdersJSON,
    musicbillMaxAmount: ctx.user.musicbillMaxAmount,
    createMusicMaxAmountPerDay: ctx.user.createMusicMaxAmountPerDay,
    lastActiveTimestamp: ctx.user.lastActiveTimestamp,
    musicPlayRecordIndate: ctx.user.musicPlayRecordIndate,
  });
};
