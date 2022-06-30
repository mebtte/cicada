import db from '.';

export enum Property {
  MUSIC_ID = 'musicId',
  CONTENT = 'content',
}

export type Lyric = {
  [Property.MUSIC_ID]: string;
  [Property.CONTENT]: string;
};

export function getLyricByMusicId<P extends Property>(
  musicId: string,
  properties: P[],
) {
  return db.get<{
    [key in P]: Lyric[key];
  }>(`select ${properties.join(',')} from lyric where musicId = ?`, [musicId]);
}
