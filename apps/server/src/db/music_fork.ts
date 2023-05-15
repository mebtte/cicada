import { MusicFork, MusicForkProperty } from '@/constants/db_definition';
import { getDB } from '.';

export async function getMusicForkFromList<P extends MusicForkProperty>(
  musicId: string,
  properties: P[],
) {
  return getDB().all<{
    [key in P]: MusicFork[key];
  }>(
    `
      SELECT ${properties.join(', ')} FROM music_fork
        WHERE musicId = ?
    `,
    [musicId],
  );
}

export async function getMusicForkList<P extends MusicForkProperty>(
  musicId: string,
  properties: P[],
) {
  return getDB().all<{
    [key in P]: MusicFork[key];
  }>(
    `
      SELECT ${properties.join(', ')} FROM music_fork
        WHERE forkFrom = ?
    `,
    [musicId],
  );
}
