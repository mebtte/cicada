import { ExceptionCode } from '#/constants/exception';
import { AllowUpdateKey } from '#/constants/music';
import db from '@/db';
import { saveMusicModifyRecord } from '@/db/music_modify_record';
import stringArrayEqual from '#/utils/string_array_equal';
import {
  getMusicForkFromList,
  Property as MusicForkProperty,
} from '@/db/music_fork';
import { getMusicListByIds, Property as MusicProperty } from '@/db/music';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (
    !Array.isArray(value) ||
    value.length > 100 ||
    value.find((v) => typeof v !== 'string')
  ) {
    return ctx.error(ExceptionCode.PARAMETER_ERROR);
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

  const musicList = await getMusicListByIds(value, [MusicProperty.ID]);
  if (musicList.length !== value.length) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXIST);
  }

  await Promise.all([
    db.run(
      `
        DELETE FROM music_fork
        WHERE id IN ( ${oldForkFromList.map(() => '?').join(', ')} )
      `,
      oldForkFromList.map((f) => f.id),
    ),
    db.run(
      `
        INSERT INTO music_fork ( musicId, forkFrom )
        VALUES ${value.map(() => '( ?, ? )').join(', ')}
      `,
      value.map((v) => [music.id, v]).flat(),
    ),
    saveMusicModifyRecord({
      musicId: music.id,
      key: AllowUpdateKey.FORK_FROM,
      modifyUserId: ctx.user.id,
    }),
  ]);

  return ctx.success();
};
