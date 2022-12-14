import { Property as UserProperty } from '@/db/user';
import excludeProperty from '#/utils/exclude_property';
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
];
const NOT_PROFILE_PROPERTIES = Object.values(UserProperty).filter(
  (p) => !PROFILE_PROPERTIES.includes(p),
);

export default (ctx: Context) =>
  ctx.success(excludeProperty(ctx.user, NOT_PROFILE_PROPERTIES));
