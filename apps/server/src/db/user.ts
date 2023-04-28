import { UserProperty, User, USER_TABLE_NAME } from '@/constants/db_definition';
import { getDB } from '.';

export function getUserByEmail<P extends UserProperty>(
  email: string,
  properties: P[],
) {
  return getDB().get<{
    [key in P]: User[key];
  }>(
    `
      SELECT
        ${properties.join(',')}
      FROM ${USER_TABLE_NAME}
      WHERE ${UserProperty.EMAIL} = ?
    `,
    [email],
  );
}

export function getUserById<P extends UserProperty>(
  id: string,
  properties: P[],
) {
  return getDB().get<{
    [key in P]: User[key];
  }>(
    `
      SELECT
        ${properties.join(',')}
      FROM ${USER_TABLE_NAME}
      WHERE ${UserProperty.ID} = ?
    `,
    [id],
  );
}

export function getUserListByIds<P extends UserProperty>(
  ids: string[],
  properties: P[],
) {
  return getDB().all<Pick<User, P>>(
    `
      SELECT
        ${properties.map((p) => `\`${p}\``).join(',')}
      FROM ${USER_TABLE_NAME}
      WHERE ${UserProperty.ID} IN ( ${ids.map(() => '?')} )
    `,
    [ids],
  );
}

export function updateUser<
  P extends
    | UserProperty.AVATAR
    | UserProperty.NICKNAME
    | UserProperty.REMARK
    | UserProperty.ADMIN
    | UserProperty.MUSICBILL_ORDERS_JSON
    | UserProperty.EMAIL
    | UserProperty.MUSICBILL_MAX_AMOUNT
    | UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY
    | UserProperty.EXPORT_MUSICBILL_MAX_TIME_PER_DAY
    | UserProperty.LAST_ACTIVE_TIMESTAMP,
>({ id, property, value }: { id: string; property: P; value: User[P] }) {
  return getDB().run(
    `
      UPDATE ${USER_TABLE_NAME} SET ${property} = ?
      WHERE ${UserProperty.ID} = ?
    `,
    [value, id],
  );
}
