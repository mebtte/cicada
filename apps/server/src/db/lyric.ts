import { Lyric, LyricProperty } from '@/constants/db_definition';
import { getDB } from '.';

export function getLyricListByMusicId<P extends LyricProperty>(
  musicId: string,
  properties: P[],
) {
  return getDB().all<{
    [key in P]: Lyric[key];
  }>(
    `
      SELECT ${properties.join(',')} FROM lyric WHERE musicId = ?
    `,
    [musicId],
  );
}
