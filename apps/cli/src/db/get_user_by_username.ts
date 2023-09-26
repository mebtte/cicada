import { UserProperty, User, USER_TABLE_NAME } from '@/constants/db_definition';
import { getDB } from '.';

function getUserByUsername<P extends UserProperty>(
  username: string,
  properties: P[],
) {
  return getDB().get<{
    [key in P]: User[key];
  }>(
    `
      SELECT
        ${properties.join(',')}
      FROM ${USER_TABLE_NAME}
      WHERE ${UserProperty.USERNAME} = ?
    `,
    [username],
  );
}

export default getUserByUsername;
