import db from '@/db';

export enum Property {
  ID = 'id',
  MUSICBILL_ID = 'musicbillId',
  USER_ID = 'userId',
  COLLECT_TIMESTAMP = 'collectTimestamp',
}

export type MusicbillCollection = {
  [Property.ID]: number;
  [Property.MUSICBILL_ID]: string;
  [Property.USER_ID]: string;
  [Property.COLLECT_TIMESTAMP]: number;
};

export function getMusicbillCollection<P extends Property>({
  musicbillId,
  userId,
  properties,
}: {
  musicbillId: string;
  userId: string;
  properties: P[];
}) {
  return db.get<{
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
  return db.run(
    `
      INSERT INTO musicbill_collection ( musicbillId, userId, collectTimestamp )
      VALUES ( ?, ?, ? )
    `,
    [musicbillId, userId, Date.now()],
  );
}
