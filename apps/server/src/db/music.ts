import { MusicType } from '#/constants/music';
import generateRandomString from '#/utils/generate_random_string';
import { getDB } from '.';
import { MusicProperty, Music } from '../constants/db_definition';

export function getMusicById<P extends MusicProperty>(
  id: string,
  properties: P[],
) {
  return getDB().get<{
    [key in P]: Music[key];
  }>(
    `
      SELECT
        ${properties.join(',')}
      FROM music
      WHERE id = ?
    `,
    [id],
  );
}

export function getMusicListByIds<P extends MusicProperty>(
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
  P extends
    | MusicProperty.COVER
    | MusicProperty.NAME
    | MusicProperty.ALIASES
    | MusicProperty.ASSET,
>({ id, property, value }: { id: string; property: P; value: Music[P] }) {
  return getDB().run(
    `
      UPDATE music SET ${property} = ?
      WHERE id = ?
    `,
    [value, id],
  );
}
