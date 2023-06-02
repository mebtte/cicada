import { ExceptionCode } from '#/constants/exception';
import { getDB } from '@/db';
import { getMusicbillCollection } from '@/db/musicbill_collection';
import { PublicMusicbillCollectionProperty } from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.request.query as { id: unknown };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbillCollection = await getMusicbillCollection({
    musicbillId: id,
    userId: ctx.user.id,
    properties: [PublicMusicbillCollectionProperty.ID],
  });
  if (!musicbillCollection) {
    return ctx.except(ExceptionCode.NOT_COLLECT_MUSICBILL_YET);
  }

  await getDB().run(
    `
      DELETE FROM musicbill_collection
      WHERE id = ?
    `,
    [musicbillCollection.id],
  );

  return ctx.success(null);
};
