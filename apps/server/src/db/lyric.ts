import db from '.';

export enum Property {
  ID = 'id',
  MUSIC_ID = 'musicId',
  LRC = 'lrc',
  LRC_CONTENT = 'lrcContent',
}

export type Lyric = {
  [Property.ID]: number;
  [Property.MUSIC_ID]: string;
  [Property.LRC]: string;
  [Property.LRC_CONTENT]: string;
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
