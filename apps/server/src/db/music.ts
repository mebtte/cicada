import { MusicType } from '#/constants/music';
import db from '.';

export enum Property {
  ID = 'id',
  TYPE = 'type',
  NAME = 'name',
  ALIASES = 'aliases',
  COVER = 'cover',
  SQ = 'sq',
  HQ = 'hq',
  AC = 'ac',
  EFFECTIVE_PLAY_TIMES = 'effectivePlayTimes',
  CREATE_USER_ID = 'createUserId',
  CREATE_TIMESTAMP = 'createTimestamp',
}

export type Music = {
  [Property.ID]: string;
  [Property.TYPE]: MusicType;
  [Property.NAME]: string;
  [Property.ALIASES]: string;
  [Property.COVER]: string;
  [Property.SQ]: string;
  [Property.HQ]: string;
  [Property.AC]: string;
  [Property.EFFECTIVE_PLAY_TIMES]: number;
  [Property.CREATE_USER_ID]: string;
  [Property.CREATE_TIMESTAMP]: number;
};

export function getMusicById<P extends Property>(id: string, properties: P[]) {
  return db.get<{
    [key in P]: Music[key];
  }>(`select ${properties.join(',')} from music where id = ?`, [id]);
}

export function getMusicListByIds<P extends Property>(
  ids: string[],
  properties: P[],
) {
  return db.all<{
    [key in P]: Music[key];
  }>(
    `
      select ${properties.join(',')} from music
        where id in ( ${ids.map(() => '?')} )
    `,
    ids,
  );
}
