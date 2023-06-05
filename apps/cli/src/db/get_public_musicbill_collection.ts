import {
  PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME,
  PublicMusicbillCollection,
  PublicMusicbillCollectionProperty,
} from '@/constants/db_definition';
import { getDB } from '.';

function getPublicMusicbillCollection<
  P extends PublicMusicbillCollectionProperty,
>({
  musicbillId,
  userId,
  properties,
}: {
  musicbillId: string;
  userId: string;
  properties: P[];
}) {
  return getDB().get<{
    [key in P]: PublicMusicbillCollection[P];
  }>(
    `
      SELECT
        ${properties.join(', ')}
      FROM ${PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME}
      WHERE ${PublicMusicbillCollectionProperty.MUSICBILL_ID} = ?
        AND ${PublicMusicbillCollectionProperty.USER_ID} = ?
    `,
    [musicbillId, userId],
  );
}

export default getPublicMusicbillCollection;
