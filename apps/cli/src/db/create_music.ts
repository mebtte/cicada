import { ID_LENGTH, MusicType } from '#/constants/music';
import generateRandomString from '#/utils/generate_random_string';
import { MUSIC_TABLE_NAME, MusicProperty } from '@/constants/db_definition';
import { getDB } from '.';

async function createMusic({
  type,
  name,
  asset,
  createUserId,
}: {
  type: MusicType;
  name: string;
  asset: string;
  createUserId: string;
}) {
  const id = generateRandomString(ID_LENGTH, false);
  await getDB().run(
    `
      INSERT INTO ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID}, ${MusicProperty.TYPE}, ${MusicProperty.NAME}, ${MusicProperty.ASSET}, ${MusicProperty.CREATE_USER_ID}, ${MusicProperty.CREATE_TIMESTAMP} )
      VALUES ( ?, ?, ?, ?, ?, ? )
    `,
    [id, type, name, asset, createUserId, Date.now()],
  );
  return id;
}

export default createMusic;
