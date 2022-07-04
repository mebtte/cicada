import db from '@/db';

export enum Property {
  ID = 'id',
  SINGER_ID = 'singerId',
  CONTENT = 'content',
  MODIFY_USER_ID = 'modifyUserId',
  MODIFY_TIMESTAMP = 'modifyTimestamp',
}

export type SingerModifyRecord = {
  [Property.ID]: number;
  [Property.SINGER_ID]: string;
  [Property.CONTENT]: string;
  [Property.MODIFY_USER_ID]: string;
  [Property.MODIFY_TIMESTAMP]: number;
};

export function saveSingerModifyRecord({
  singerId,
  key,
  value,
  modifyUserId,
}: {
  singerId: string;
  key: 'avatar' | 'name' | 'aliases';
  value: number | string;
  modifyUserId: string;
}) {
  return db.run(
    `
      insert into singer_modify_record(singerId, content, modifyUserId, modifyTimestamp)
        values( ?, ?, ?, ? )
    `,
    [
      singerId,
      JSON.stringify({
        key,
        value,
      }),
      modifyUserId,
      Date.now(),
    ],
  );
}
