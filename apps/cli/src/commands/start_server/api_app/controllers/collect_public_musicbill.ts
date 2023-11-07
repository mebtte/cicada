import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById } from '@/db/musicbill';
import getPublicMusicbillCollection from '@/db/get_public_musicbill_collection';
import {
  PublicMusicbillCollectionProperty,
  MusicbillProperty,
  PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.request.body as {
    id: unknown;
  };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const [musicbill, musicbillCollection] = await Promise.all([
    getMusicbillById(id, [MusicbillProperty.PUBLIC]),
    getPublicMusicbillCollection({
      musicbillId: id,
      userId: ctx.user.id,
      properties: [PublicMusicbillCollectionProperty.ID],
    }),
  ]);
  if (!musicbill || !musicbill.public) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXISTED);
  }
  if (musicbillCollection) {
    return ctx.except(ExceptionCode.CAN_NOT_COLLECT_MUSICBILL_REPEATLY);
  }

  await getDB().run(
    `
      INSERT INTO ${PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME} ( ${PublicMusicbillCollectionProperty.MUSICBILL_ID}, ${PublicMusicbillCollectionProperty.USER_ID}, ${PublicMusicbillCollectionProperty.COLLECT_TIMESTAMP} )
      VALUES ( ?, ?, ? )
    `,
    [id, ctx.user.id, Date.now()],
  );
  return ctx.success(null);
};
