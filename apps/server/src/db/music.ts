import { MusicType } from '#/constants/music';
import generateRandomString from '#/utils/generate_random_string';
import { getDB } from '.';

export enum Property {
  ID = 'id',
  TYPE = 'type',
  NAME = 'name',
  ALIASES = 'aliases',
  COVER = 'cover',
  ASSET = 'asset',
  HEAT = 'heat',
  CREATE_USER_ID = 'createUserId',
  CREATE_TIMESTAMP = 'createTimestamp',
}

export type Music = {
  [Property.ID]: string;
  [Property.TYPE]: MusicType;
  [Property.NAME]: string;
  [Property.ALIASES]: string;
  [Property.COVER]: string;
  [Property.ASSET]: string;
  [Property.HEAT]: number;
  [Property.CREATE_USER_ID]: string;
  [Property.CREATE_TIMESTAMP]: number;
};

export function getMusicById<P extends Property>(id: string, properties: P[]) {
  return getDB().get<{
    [key in P]: Music[key];
  }>(`SELECT ${properties.join(',')} FROM music WHERE id = ?`, [id]);
}

export function getMusicListByIds<P extends Property>(
  ids: string[],
  properties: P[],
) {
  return getDB().all<{
    [key in P]: Music[key];
  }>(
    `
      SELECT ${properties.join(',')} FROM music
      WHERE id IN ( ${ids.map(() => '?')} )
    `,
    ids,
  );
}

export async function createMusic({
  type,
  name,
  sq,
  createUserId,
}: {
  type: MusicType;
  name: string;
  sq: string;
  createUserId: string;
}) {
  const id = generateRandomString(8, false);
  await getDB().run(
    `
      INSERT INTO
      music ( id, type, name, sq, createUserId, createTimestamp )
      VALUES( ?, ?, ?, ?, ?, ? )
    `,
    [id, type, name, sq, createUserId, Date.now()],
  );
  return id;
}

export function updateMusic<
  P extends Property.COVER | Property.NAME | Property.ALIASES | Property.ASSET,
>({ id, property, value }: { id: string; property: P; value: Music[P] }) {
  return getDB().run(
    `
      UPDATE music SET ${property} = ?
      WHERE id = ?
    `,
    [value, id],
  );
}
