import { getDB } from '.';

export enum Property {
  ID = 'id',
  EMAIL = 'email',
  AVATAR = 'avatar',
  NICKNAME = 'nickname',
  JOIN_TIMESTAMP = 'joinTimestamp',
  ADMIN = 'admin',
  REMARK = 'remark',
  MUSICBILL_ORDERS_JSON = 'musicbillOrdersJSON',
  MUSICBILL_MAX_AMOUNT = 'musicbillMaxAmount',
  CREATE_MUSIC_MAX_AMOUNT_PER_DAY = 'createMusicMaxAmountPerDay',
  EXPORT_MUSICBILL_MAX_TIME_PER_DAY = 'exportMusicbillMaxTimePerDay',
}

export type User = {
  [Property.ID]: string;
  [Property.EMAIL]: string;
  [Property.AVATAR]: string;
  [Property.NICKNAME]: string;
  [Property.JOIN_TIMESTAMP]: number;
  [Property.ADMIN]: 0 | 1;
  [Property.REMARK]: string;
  [Property.MUSICBILL_ORDERS_JSON]: string | null;
  [Property.MUSICBILL_MAX_AMOUNT]: number;
  [Property.CREATE_MUSIC_MAX_AMOUNT_PER_DAY]: number;
  [Property.EXPORT_MUSICBILL_MAX_TIME_PER_DAY]: number;
};

export function getUserByEmail<P extends Property>(
  email: string,
  properties: P[],
) {
  return getDB().get<{
    [key in P]: User[key];
  }>(`select ${properties.join(',')} from user where email = ?`, [email]);
}

export function getUserById<P extends Property>(id: string, properties: P[]) {
  return getDB().get<{
    [key in P]: User[key];
  }>(`select ${properties.join(',')} from user where id = ?`, [id]);
}

export function getUserListByIds<P extends Property>(
  ids: string[],
  properties: P[],
) {
  return getDB().all<Pick<User, P>>(
    `
      select ${properties.map((p) => `\`${p}\``).join(',')} from user
        where id in ( ${ids.map(() => '?')} )
    `,
    [ids],
  );
}

export function updateUser<
  P extends
    | Property.AVATAR
    | Property.NICKNAME
    | Property.REMARK
    | Property.ADMIN
    | Property.MUSICBILL_ORDERS_JSON,
>({ id, property, value }: { id: string; property: P; value: User[P] }) {
  return getDB().run(
    `
      update user set ${property} = ?
        where id = ?
    `,
    [value, id],
  );
}
