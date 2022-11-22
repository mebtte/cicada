import fs from 'fs/promises';
import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById, Property } from '@/db/musicbill';
import {
  getMusicbillMusicList,
  Property as MusicbillMusicProperty,
} from '@/db/musicbill_music';
import { TRASH_DIR } from '@/constants/directory';
import db from '@/db';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: string };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(id, Object.values(Property));
  if (!musicbill || musicbill.userId !== ctx.user.id) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const musicList = await getMusicbillMusicList(id, [
    MusicbillMusicProperty.MUSIC_ID,
    MusicbillMusicProperty.ADD_TIMESTAMP,
  ]);
  await fs.writeFile(
    `${TRASH_DIR}/deleted_musicbill_${id}.json`,
    JSON.stringify({
      ...musicbill,
      musicList,
    }),
  );

  /**
   * 从数据库移除
   */
  await Promise.all([
    db.run(
      `
        DELETE FROM musicbill_music
        WHERE musicbillId = ?
      `,
      [id],
    ),
    db.run(
      `
        DELETE FROM musicbill_export
        WHERE musicbillId = ?
      `,
      [id],
    ),
  ]);
  await db.run(
    `
      DELETE FROM musicbill
      WHERE id = ?
    `,
    [id],
  ); // musicbill

  return ctx.success();
};
