import * as db from '@/platform/db';

export enum Property {
  ID = 'id',
  EMAIL = 'email',
  AVATAR = 'avatar',
  NICKNAME = 'nickname',
  JOIN_TIMESTAMP = 'joinTimestamp',
  SUPER = 'super',
  REMARK = 'remark',
}

type PropertyMapType = {
  [Property.ID]: string;
  [Property.EMAIL]: string;
  [Property.AVATAR]: string;
  [Property.NICKNAME]: string;
  [Property.JOIN_TIMESTAMP]: number;
  [Property.SUPER]: number;
  [Property.ID]: string;
};

export function getUserByEmail<P extends Property>(
  email: string,
  properties: P[],
) {
  return db.get<{
    // @ts-expect-error
    [key in P]: PropertyMapType[key];
  }>(`select ${properties.join(',')} from user where email = ?`, [email]);
}
