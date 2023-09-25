import { UserProperty, User, USER_TABLE_NAME } from '@/constants/db_definition';
import { getDB } from '.';

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
        ${properties.join(', ')}
      FROM ${USER_TABLE_NAME}
      WHERE ${UserProperty.ID} IN ( ${ids.map(() => '?').join(', ')} )
    `,
    ids,
  );
}
