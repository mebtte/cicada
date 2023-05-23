import {
  MusicbillMusic,
  MusicbillMusicProperty,
} from '@/constants/db_definition';
import { getDB } from '.';

export function getMusicbillMusic<P extends MusicbillMusicProperty>(
  musicbillId: string,
  musicId: string,
  properties: P[],
) {
  return getDB().get<{
    [key in P]: MusicbillMusic[key];
  }>(
    `
      select ${properties.join(',')} from musicbill_music
        where musicbillId = ? and musicId = ?
    `,
    [musicbillId, musicId],
  );
}

export function getMusicbillMusicList<P extends MusicbillMusicProperty>(
  musicbillId: string,
  properties: P[],
) {
  return getDB().all<{
    [key in P]: MusicbillMusic[key];
  }>(
    `
      select ${properties.join(',')} from musicbill_music
        where musicbillId = ?
    `,
    [musicbillId],
  );
}

export function addMusicbillMusic(musicbillId: string, musicId: string) {
  return getDB().run(
    `
      insert into musicbill_music(musicbillId, musicId, addTimestamp)
        values(?, ?, ?)
    `,
    [musicbillId, musicId, Date.now()],
  );
}

export function removeMusicbillMusicById(id: number) {
  return getDB().run(
    `
      delete from musicbill_music
        where id = ?
    `,
    [id],
  );
}
