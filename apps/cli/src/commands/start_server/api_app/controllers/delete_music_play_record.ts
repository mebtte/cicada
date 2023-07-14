import { getDB } from '@/db';
import {
  MUSIC_PLAY_RECORD_TABLE_NAME,
  MusicPlayRecord,
  MusicPlayRecordProperty,
} from '@/constants/db_definition';
import { ExceptionCode } from '#/constants/exception';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const id = Number(ctx.query.id);
  if (!id) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicPlayRecord = await getDB().get<
    Pick<MusicPlayRecord, MusicPlayRecordProperty.USER_ID>
  >(
    `
      SELECT
        ${MusicPlayRecordProperty.USER_ID}
      FROM ${MUSIC_PLAY_RECORD_TABLE_NAME}
      WHERE ${MusicPlayRecordProperty.ID} = ?
    `,
    [id],
  );
  if (!musicPlayRecord || ctx.user.id !== musicPlayRecord.userId) {
    return ctx.except(ExceptionCode.MUSIC_PLAY_RECORD_NOT_EXISTED);
  }

  await getDB().run(
    `
      DELETE FROM ${MUSIC_PLAY_RECORD_TABLE_NAME}
      WHERE ${MusicPlayRecordProperty.ID} = ?
    `,
    [id],
  );
  return ctx.success(null);
};
