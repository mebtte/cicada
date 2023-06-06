import { getDB } from '.';
import {
  MusicProperty,
  Music,
  MUSIC_TABLE_NAME,
} from '../constants/db_definition';

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
      FROM ${MUSIC_TABLE_NAME}
      WHERE ${MusicProperty.ID} = ?
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
      SELECT ${properties.join(',')} FROM ${MUSIC_TABLE_NAME}
      WHERE ${MusicProperty.ID} IN ( ${ids.map(() => '?')} )
    `,
    ids,
  );
}

export function updateMusic<
  P extends
    | MusicProperty.COVER
    | MusicProperty.NAME
    | MusicProperty.ALIASES
    | MusicProperty.ASSET
    | MusicProperty.YEAR,
>({ id, property, value }: { id: string; property: P; value: Music[P] }) {
  return getDB().run(
    `
      UPDATE ${MUSIC_TABLE_NAME} SET ${property} = ?
      WHERE ${MusicProperty.ID} = ?
    `,
    [value, id],
  );
}
