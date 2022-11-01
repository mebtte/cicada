import db from '.';

export enum Property {
  ID = 'id',
  MUSIC_ID = 'musicId',
  CONTENT = 'content',
}

export type Lyric = {
  [Property.ID]: number;
  [Property.MUSIC_ID]: string;
  [Property.CONTENT]: string;
};

export function getLyricListByMusicId<P extends Property>(
  musicId: string,
  properties: P[],
) {
  return db.all<{
    [key in P]: Lyric[key];
  }>(
    `
      SELECT ${properties.join(',')} FROM lyric WHERE musicId = ?
    `,
    [musicId],
  );
}
