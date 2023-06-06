import generateRandomString from '#/utils/generate_random_string';
import { Musicbill, MusicbillProperty } from '@/constants/db_definition';
import { getDB } from '.';

export function getMusicbillById<P extends MusicbillProperty>(
  id: string,
  properties: P[],
) {
  return getDB().get<{
    [key in P]: Musicbill[key];
  }>(
    `
      select ${properties.map((p) => `\`${p}\``).join(',')} from musicbill
        where id = ?
    `,
    [id],
  );
}

export function getUserMusicbillList<P extends MusicbillProperty>(
  userId: string,
  properties: P[],
) {
  return getDB().all<{
    [key in P]: Musicbill[key];
  }>(
    `
      select ${properties.map((p) => `\`${p}\``).join(',')} from musicbill
        where userId = ?
    `,
    [userId],
  );
}

export async function createMusicbill({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const id = generateRandomString(8, false);
  await getDB().run(
    `
      insert into musicbill(id, userId, name, createTimestamp)
        values(?, ?, ?, ?)
    `,
    [id, userId, name, Date.now()],
  );
  return id;
}

export function updateMusicbill<
  P extends
    | MusicbillProperty.COVER
    | MusicbillProperty.NAME
    | MusicbillProperty.PUBLIC,
>(id: string, property: P, value: Musicbill[P]) {
  return getDB().run(
    `
      update musicbill set ${property} = ?
        where id = ?
    `,
    [value, id],
  );
}
