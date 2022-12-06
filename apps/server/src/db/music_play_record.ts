import { getDB } from '.';

export enum Property {
  ID = 'id',
  USER_ID = 'userId',
  MUSIC_ID = 'musicId',
  PERCENT = 'percent',
  TIMESTAMP = 'timestamp',
}

export interface MusicPlayRecord {
  [Property.ID]: string;
  [Property.USER_ID]: string;
  [Property.MUSIC_ID]: string;
  [Property.PERCENT]: number;
  [Property.TIMESTAMP]: number;
}

export function addMusicPlayRecord({
  userId,
  musicId,
  percent,
}: {
  userId: string;
  musicId: string;
  percent: number;
}) {
  return getDB().run(
    `
      insert into music_play_record(userId, musicId, percent, timestamp)
        values(?, ?, ?, ?)
    `,
    [userId, musicId, percent, Date.now()],
  );
}

export function getMusicPlayRecordList<P extends Property>(
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
