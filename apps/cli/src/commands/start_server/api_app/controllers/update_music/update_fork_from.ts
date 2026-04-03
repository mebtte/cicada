import { ExceptionCode } from '#/constants/exception';
import { AllowUpdateKey } from '#/constants/music';
import { getDB } from '@/db';
import { saveMusicModifyRecord } from '@/db/music_modify_record';
import stringArrayEqual from '#/utils/string_array_equal';
import { getMusicForkFromList } from '@/db/music_fork';
import { getMusicListByIds } from '@/db/music';
import { MusicForkProperty, MusicProperty } from '@/constants/db_definition';
import { Parameter } from './constants';

function isString(s: unknown): s is string {
  return typeof s === 'string';
}

export default async ({ ctx, music, value }: Parameter) => {
  if (
    !Array.isArray(value) ||
    value.length > 100 ||
    !value.every(isString) ||
    value.find((v) => v === music.id)
  ) {
    return ctx.error(ExceptionCode.WRONG_PARAMETER);
  }

  const oldForkFromList = await getMusicForkFromList(music.id, [
    MusicForkProperty.ID,
    MusicForkProperty.FORK_FROM,
  ]);
  if (
    stringArrayEqual(
      value.sort(),
      oldForkFromList.map((f) => f.forkFrom).sort(),
    )
  ) {
    return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
  }

  if (value.length) {
    const musicList = await getMusicListByIds(value, [MusicProperty.ID]);
    if (musicList.length !== value.length) {
      return ctx.except(ExceptionCode.MUSIC_NOT_EXISTED);
    }
  }

  await Promise.all([
    getDB().run(
      `
        DELETE FROM music_fork
        WHERE id IN ( ${oldForkFromList.map(() => '?').join(', ')} )
      `,
      oldForkFromList.map((f) => f.id),
    ),
    value.length
      ? getDB().run(
          `
            INSERT INTO music_fork ( musicId, forkFrom )
            VALUES ${value.map(() => '( ?, ? )').join(', ')}
          `,
          value.map((v) => [music.id, v]).flat(),
        )
      : null,
    saveMusicModifyRecord({
      musicId: music.id,
      key: AllowUpdateKey.FORK_FROM,
      modifyUserId: ctx.user.id,
    }),
  ]);

  return ctx.success(null);
};
