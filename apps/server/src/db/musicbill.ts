import * as db from '.';

export enum Property {
  ID = 'id',
  USER_ID = 'userId',
  COVER = 'cover',
  NAME = 'name',
  PUBLIC = 'public',
  ORDER = 'order',
  ORDER_TIMESTAMP = 'orderTimestamp',
  CREATE_TIMESTAMP = 'createTimestamp',
}

export interface Musicbill {
  [Property.ID]: string;
  [Property.USER_ID]: string;
  [Property.COVER]: string;
  [Property.NAME]: string;
  [Property.PUBLIC]: 0 | 1;
  [Property.ORDER]: number;
  [Property.ORDER_TIMESTAMP]: number;
  [Property.CREATE_TIMESTAMP]: number;
}

export function getMusicbillById<P extends Property>(
  id: string,
  properties: P[],
) {
  return db.get<{
    [key in P]: Musicbill[key];
  }>(
    `
      select ${properties.map((p) => `\`${p}\``).join(',')} from musicbill
        where id = ?
    `,
    [id],
  );
}

export function getUserMusicbillList<P extends Property>(
  userId: string,
  properties: P[],
) {
  return db.all<{
    [key in P]: Musicbill[key];
  }>(
    `
      select ${properties.map((p) => `\`${p}\``).join(',')} from musicbill
        where userId = ?
    `,
    [userId],
  );
}
