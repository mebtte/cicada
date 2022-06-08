import * as db from '.';

export enum Property {
  ID = 'id',
}

export type Music = {
  [Property.ID]: string;
};

export function getMusicById<P extends Property>(id: string, properties: P[]) {
  return db.get<{
    [key in P]: Music[key];
  }>(`select ${properties.join(',')} from music where id = ?`, [id]);
}
