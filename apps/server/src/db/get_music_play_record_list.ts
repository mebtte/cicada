import {
  MusicPlayRecord,
  MusicPlayRecordProperty,
} from '@/constants/db_definition';
import { getDB } from '.';

function getMusicPlayRecordList<P extends MusicPlayRecordProperty>(
  musicId: string,
  properties: P[],
) {
  return getDB().all<{
    [key in P]: MusicPlayRecord[key];
  }>(
    `
      SELECT ${properties.join(', ')} FROM music_play_record
      WHERE musicId = ?
    `,
    [musicId],
  );
}

export default getMusicPlayRecordList;
