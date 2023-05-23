import { AllowUpdateKey } from '#/constants/music';
import {
  MusicModifyRecord,
  MusicModifyRecordProperty,
} from '@/constants/db_definition';
import { getDB } from '.';

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

export function getMusicModifyRecordList<P extends MusicModifyRecordProperty>(
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
