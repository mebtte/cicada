import { AllowUpdateKey } from '#/constants/singer';
import { getDB } from '.';

export enum Property {
  ID = 'id',
  SINGER_ID = 'singerId',
  KEY = 'key',
  MODIFY_USER_ID = 'modifyUserId',
  MODIFY_TIMESTAMP = 'modifyTimestamp',
}

export type SingerModifyRecord = {
  [Property.ID]: number;
  [Property.SINGER_ID]: string;
  [Property.KEY]: string;
  [Property.MODIFY_USER_ID]: string;
  [Property.MODIFY_TIMESTAMP]: number;
};

export function saveSingerModifyRecord({
  singerId,
  key,
  modifyUserId,
}: {
  singerId: string;
  key: AllowUpdateKey;
  modifyUserId: string;
}) {
  return getDB().run(
    `
      insert into singer_modify_record(singerId, key, modifyUserId, modifyTimestamp)
        values( ?, ?, ?, ? )
    `,
    [singerId, key, modifyUserId, Date.now()],
  );
}
