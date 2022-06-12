import * as db from '.';

export enum Property {
  MUSIC_ID = 'musicId',
  LRC = 'lrc',
}

export type MusicLrc = {
  [Property.MUSIC_ID]: string;
  [Property.LRC]: string;
};

export function getMusicLrcByMusicId<P extends Property>(
  musicId: string,
  properties: P[],
) {
  return db.get<{
    [key in P]: MusicLrc[key];
  }>(`select ${properties.join(',')} from music_lrc where musicId = ?`, [
    musicId,
  ]);
}
