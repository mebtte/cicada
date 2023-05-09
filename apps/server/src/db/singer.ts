import generateRandomString from '#/utils/generate_random_string';
import { SingerProperty, Singer } from '@/constants/db_definition';
import { getDB } from '.';

export function getSingerListInMusicIds<P extends SingerProperty>(
  musicIds: string[],
  properties: P[],
) {
  return getDB().all<
    {
      musicId: string;
    } & Pick<Singer, P>
  >(
    `
    SELECT
      ${properties.map((p) => `c.${p}`).join(',')},
      msr.musicId
    FROM
      music_singer_relation AS msr
      LEFT JOIN singer AS c ON msr.singerId = c.id 
    WHERE
      msr.musicId IN ( ${musicIds.map(() => '?').join(',')} );
  `,
    musicIds,
  );
}

export function getSingerListByIds<P extends SingerProperty>(
  ids: string[],
  properties: P[],
) {
  return getDB().all<Pick<Singer, P>>(
    `
      select ${properties.join(',')} from singer
        where id in ( ${ids.map(() => '?')} )
    `,
    ids,
  );
}

export function getSingerById<P extends SingerProperty>(
  id: string,
  properties: P[],
) {
  return getDB().get<Pick<Singer, P>>(
    `
      SELECT
        ${properties.join(',')}
      FROM singer
      WHERE id = ?
    `,
    [id],
  );
}

export function getSingerByName<P extends SingerProperty>(
  name: string,
  properties: P[],
) {
  return getDB().get<Pick<Singer, P>>(
    `
      SELECT
        ${properties.join(',')}
      FROM singer
      WHERE name = ?
    `,
    [name],
  );
}

export async function createSinger({
  name,
  createUserId,
}: {
  name: string;
  createUserId: string;
}) {
  const id = generateRandomString(6, false);
  await getDB().run(
    `
      INSERT INTO
      singer( id, name, createUserId, createTimestamp )
      VALUES( ?, ?, ?, ? )
    `,
    [id, name, createUserId, Date.now()],
  );
  return id;
}

export function updateSinger<
  P extends
    | SingerProperty.ALIASES
    | SingerProperty.AVATAR
    | SingerProperty.NAME,
>({ id, property, value }: { id: string; property: P; value: Singer[P] }) {
  return getDB().run(
    `
      update singer set ${property} = ? where id = ?
    `,
    [value, id],
  );
}
