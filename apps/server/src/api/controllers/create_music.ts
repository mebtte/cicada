import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { NAME_MAX_LENGTH, MUSIC_TYPES } from '#/constants/music';
import exist from '#/utils/exist';
import generateRandomString from '#/utils/generate_random_string';
import { getSingerListByIds, Property as SingerProperty } from '@/db/singer';
import { getAssetPath } from '@/platform/asset';
import * as db from '@/db';
import day from '#/utils/day';
import { Music, Property as MusicProperty } from '@/db/music';
import argv from '@/argv';
import { Context } from '../constants';

const ID_LENGTH = 8;

export default async (ctx: Context) => {
  const { name, singerIds, type, sq } = ctx.request.body;

  if (
    typeof name !== 'string' ||
    !name.length ||
    name.length > NAME_MAX_LENGTH ||
    typeof singerIds !== 'string' ||
    !singerIds.length ||
    !MUSIC_TYPES.includes(type) ||
    typeof sq !== 'string'
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const sqExist = await exist(getAssetPath(sq, AssetType.MUSIC_SQ));
  if (!sqExist) {
    return ctx.except(ExceptionCode.ASSET_NOT_EXIST);
  }

  const singerIdList = singerIds.split(',');
  const singerList = await getSingerListByIds(singerIdList, [
    SingerProperty.ID,
  ]);
  if (singerList.length !== singerIdList.length) {
    return ctx.except(ExceptionCode.SINGER_NOT_EXIST);
  }

  const todayUploadMusicList = await db.all<Pick<Music, MusicProperty.ID>>(
    `
      select id from music
        where createUserId = ?
          and createTimestamp > ? and createTimestamp < ?
    `,
    [ctx.user.id, day().startOf('day'), day().endOf('day')],
  );
  if (todayUploadMusicList.length > argv.userUploadMusicMaxTimesPerDay) {
    return ctx.except(ExceptionCode.OVER_UPLOAD_MUSIC_TIMES_PER_DAY);
  }

  const id = generateRandomString(ID_LENGTH, false);
  await db.run(
    `
      insert into music ( id, type, name, sq, createUserId, createTimestamp )
        values( ?, ?, ?, ?, ?, ? )
    `,
    [id, type, name, sq, ctx.user.id, Date.now()],
  );
  await db.run(
    `
      insert into music_singer_relation ( musicId, singerId )
        values ${singerIdList.map(() => '( ?, ? )').join(', ')}
    `,
    singerIdList.map((singerId) => [id, singerId]).flat(Infinity),
  );

  return ctx.success(id);
};
