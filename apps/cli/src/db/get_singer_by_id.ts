import {
  SINGER_TABLE_NAME,
  Singer,
  SingerProperty,
} from '@/constants/db_definition';
import { getDB } from '.';

function getSingerById<P extends SingerProperty>(id: string, properties: P[]) {
  return getDB().get<Pick<Singer, P>>(
    `
      SELECT
        ${properties.join(',')}
      FROM ${SINGER_TABLE_NAME}
      WHERE ${SingerProperty.ID} = ?
      LIMIT 1
    `,
    [id],
  );
}

export default getSingerById;
