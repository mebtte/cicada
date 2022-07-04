import db from '@/db';

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

export async function getMusicForkFromList(musicId: string) {
  const forkFromList = await db.all<Pick<MusicFork, Property.FORK_FROM>>(
    `
      select forkFrom from music_fork
        where musicId = ?
    `,
    [musicId],
  );
  return forkFromList.map((f) => f.forkFrom);
}

export async function getMusicForkList(musicId: string) {
  const forkList = await db.all<Pick<MusicFork, Property.MUSIC_ID>>(
    `
      select musicId from music_fork
        where forkFrom = ?
    `,
    [musicId],
  );
  return forkList.map((f) => f.musicId);
}
