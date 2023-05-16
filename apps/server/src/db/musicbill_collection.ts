import {
  MusicbillCollection,
  MusicbillCollectionProperty,
} from '@/constants/db_definition';
import { getDB } from '.';

export function getMusicbillCollection<P extends MusicbillCollectionProperty>({
  musicbillId,
  userId,
  properties,
}: {
  musicbillId: string;
  userId: string;
  properties: P[];
}) {
  return getDB().get<{
    [key in P]: MusicbillCollection[P];
  }>(
    `
      SELECT
        ${properties.join(', ')}
      FROM musicbill_collection
      WHERE musicbillId = ?
        AND userId = ?
    `,
    [musicbillId, userId],
  );
}

export function createMusicbillCollection({
  musicbillId,
  userId,
}: {
  musicbillId: string;
  userId: string;
}) {
  return getDB().run(
    `
      INSERT INTO musicbill_collection ( musicbillId, userId, collectTimestamp )
      VALUES ( ?, ?, ? )
    `,
    [musicbillId, userId, Date.now()],
  );
}
