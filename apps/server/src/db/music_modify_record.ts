import { AllowUpdateKey } from '#/constants/music';
import { getDB } from '.';

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
  return getDB().run(
    `
      insert into music_modify_record(musicId, key, modifyUserId, modifyTimestamp)
        values( ?, ?, ?, ? )
    `,
    [musicId, key, modifyUserId, Date.now()],
  );
}

export function getMusicModifyRecordList<P extends Property>(
  musicId: string,
  properties: P[],
) {
  return getDB().all<{
    [key in P]: MusicModifyRecord[key];
  }>(
    `
      SELECT ${properties.join(', ')} FROM music_modify_record
      WHERE musicId = ?
    `,
    [musicId],
  );
}
