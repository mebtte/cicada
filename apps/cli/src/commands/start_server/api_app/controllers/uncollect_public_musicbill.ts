import { ExceptionCode } from '#/constants/exception';
import { getDB } from '@/db';
import getPublicMusicbillCollection from '@/db/get_public_musicbill_collection';
import {
  PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME,
  PublicMusicbillCollectionProperty,
} from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.request.query as { id: unknown };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbillCollection = await getPublicMusicbillCollection({
    musicbillId: id,
    userId: ctx.user.id,
    properties: [PublicMusicbillCollectionProperty.ID],
  });
  if (!musicbillCollection) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_COLLECTED);
  }

  await getDB().run(
    `
      DELETE FROM ${PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME}
      WHERE ${PublicMusicbillCollectionProperty.ID} = ?
    `,
    [musicbillCollection.id],
  );
  return ctx.success(null);
};
