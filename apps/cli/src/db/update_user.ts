import { USER_TABLE_NAME, User, UserProperty } from '@/constants/db_definition';
import { getDB } from '.';

function updateUser<
  P extends
    | UserProperty.AVATAR
    | UserProperty.NICKNAME
    | UserProperty.REMARK
    | UserProperty.ADMIN
    | UserProperty.MUSICBILL_ORDERS_JSON
    | UserProperty.USERNAME
    | UserProperty.MUSICBILL_MAX_AMOUNT
    | UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY
    | UserProperty.LAST_ACTIVE_TIMESTAMP
    | UserProperty.MUSIC_PLAY_RECORD_INDATE,
>({ id, property, value }: { id: string; property: P; value: User[P] }) {
  return getDB().run(
    `
      UPDATE ${USER_TABLE_NAME} SET ${property} = ?
      WHERE ${UserProperty.ID} = ?
    `,
    [value, id],
  );
}

export default updateUser;
