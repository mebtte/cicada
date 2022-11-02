import { AllowUpdateKey } from '#/constants/music';
import db from '@/db';

export enum Property {
  ID = 'id',
  MUSIC_ID = 'musicId',
  KEY = 'key',
  MODIFY_USER_ID = 'modifyUserId',
  MODIFY_TIMESTAMP = 'modifyTimestamp',
}

export type MusicModifyRecord = {
  [Property.ID]: number;
  [Property.MUSIC_ID]: string;
  [Property.KEY]: string;
  [Property.MODIFY_USER_ID]: string;
  [Property.MODIFY_TIMESTAMP]: number;
};

export function saveMusicModifyRecord({
  musicId,
  key,
  modifyUserId,
}: {
  musicId: string;
  key: AllowUpdateKey;
  modifyUserId: string;
}) {
  return db.run(
    `
      insert into music_modify_record(musicId, key, modifyUserId, modifyTimestamp)
        values( ?, ?, ?, ? )
    `,
    [musicId, key, modifyUserId, Date.now()],
  );
}
