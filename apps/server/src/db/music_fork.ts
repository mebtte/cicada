import { getDB } from '.';

export enum Property {
  ID = 'id',
  MUSIC_ID = 'musicId',
  FORK_FROM = 'forkFrom',
}

export type MusicFork = {
  [Property.ID]: number;
  [Property.MUSIC_ID]: string;
  [Property.FORK_FROM]: string;
};

export async function getMusicForkFromList<P extends Property>(
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

export async function getMusicForkList<P extends Property>(
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
