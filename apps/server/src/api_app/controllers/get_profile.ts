import excludeProperty from '#/utils/exclude_property';
import { UserProperty } from '@/constants/db_definition';
import { updateUser } from '@/db/user';
import logger from '@/utils/logger';
import { Context } from '../constants';

const PROFILE_PROPERTIES = [
  UserProperty.ID,
  UserProperty.EMAIL,
  UserProperty.AVATAR,
  UserProperty.NICKNAME,
  UserProperty.JOIN_TIMESTAMP,
  UserProperty.ADMIN,
  UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY,
  UserProperty.EXPORT_MUSICBILL_MAX_TIME_PER_DAY,
  UserProperty.MUSICBILL_MAX_AMOUNT,
  UserProperty.MUSICBILL_ORDERS_JSON,
  UserProperty.MUSIC_PLAY_RECORD_INDATE,
];
const NOT_PROFILE_PROPERTIES = Object.values(UserProperty).filter(
  (p) => !PROFILE_PROPERTIES.includes(p),
);

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
  return ctx.success(excludeProperty(ctx.user, NOT_PROFILE_PROPERTIES));
};
