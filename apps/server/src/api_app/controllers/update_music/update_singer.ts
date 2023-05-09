import { ExceptionCode } from '#/constants/exception';
import { AllowUpdateKey } from '#/constants/music';
import { getDB } from '@/db';
import { saveMusicModifyRecord } from '@/db/music_modify_record';
import { getSingerListByIds } from '@/db/singer';
import stringArrayEqual from '#/utils/string_array_equal';
import { SingerProperty } from '@/constants/db_definition';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > 100 ||
    value.find((v) => typeof v !== 'string')
  ) {
    return ctx.error(ExceptionCode.PARAMETER_ERROR);
  }

  const oldSingerList = await getDB().all<{ id: number; singerId: string }>(
    `
      SELECT id, singerId FROM music_singer_relation
      WHERE musicId = ?
    `,
    [music.id],
  );
  if (
    stringArrayEqual(value.sort(), oldSingerList.map((s) => s.singerId).sort())
  ) {
    return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
  }

  const singerList = await getSingerListByIds(value, [SingerProperty.ID]);
  if (singerList.length !== value.length) {
    return ctx.except(ExceptionCode.SINGER_NOT_EXIST);
  }

  await Promise.all([
    getDB().run(
      `
        DELETE FROM music_singer_relation
        WHERE id IN ( ${oldSingerList.map(() => '?').join(', ')} )
      `,
      oldSingerList.map((s) => s.id),
    ),
    getDB().run(
      `
        INSERT INTO music_singer_relation ( musicId, singerId )
        VALUES ${value.map(() => '( ?, ? )').join(', ')}
      `,
      value.map((v) => [music.id, v]).flat(),
    ),
    saveMusicModifyRecord({
      musicId: music.id,
      key: AllowUpdateKey.SINGER,
      modifyUserId: ctx.user.id,
    }),
  ]);

  return ctx.success();
};
