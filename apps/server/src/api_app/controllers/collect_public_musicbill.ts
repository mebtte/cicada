import { ExceptionCode } from '#/constants/exception';
import {
  getMusicbillById,
  Property as MusicbillProperty,
} from '@/db/musicbill';
import {
  createMusicbillCollection,
  getMusicbillCollection,
  Property as MusicbillCollectionProperty,
} from '@/db/musicbill_collection';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.request.body as {
    id: unknown;
  };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const [musicbill, musicbillCollection] = await Promise.all([
    getMusicbillById(id, [MusicbillProperty.PUBLIC]),
    getMusicbillCollection({
      musicbillId: id,
      userId: ctx.user.id,
      properties: [MusicbillCollectionProperty.ID],
    }),
  ]);
  if (!musicbill || !musicbill.public) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }
  if (musicbillCollection) {
    return ctx.except(ExceptionCode.COLLECT_MUSICBILL_REPEATLY);
  }

  await createMusicbillCollection({ musicbillId: id, userId: ctx.user.id });

  return ctx.success();
};
