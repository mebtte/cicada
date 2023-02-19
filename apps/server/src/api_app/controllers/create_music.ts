import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { NAME_MAX_LENGTH, MUSIC_TYPES } from '#/constants/music';
import exist from '#/utils/exist';
import generateRandomString from '#/utils/generate_random_string';
import { getSingerListByIds, Property as SingerProperty } from '@/db/singer';
import { getAssetFilePath } from '@/platform/asset';
import { getDB } from '@/db';
import day from '#/utils/day';
import { Music, Property as MusicProperty } from '@/db/music';
import { Context } from '../constants';

const ID_LENGTH = 8;

export default async (ctx: Context) => {
  const { name, singerIds, type, sq } = ctx.request.body as {
    name?: unknown;
    singerIds?: unknown;
    type?: unknown;
    sq?: unknown;
  };

  if (
    typeof name !== 'string' ||
    !name.length ||
    name.length > NAME_MAX_LENGTH ||
    name.trim() !== name ||
    typeof singerIds !== 'string' ||
    !singerIds.length ||
    // @ts-expect-error
    !MUSIC_TYPES.includes(type) ||
    typeof sq !== 'string'
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const sqExist = await exist(getAssetFilePath(sq, AssetType.MUSIC_SQ));
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

  /**
   * 0 表示无限制
   * @author mebtte<hi@mebtte.com>
   */
  if (ctx.user.createMusicMaxAmountPerDay !== 0) {
    const now = day();
    const todayCreateMusicList = await getDB().all<
      Pick<Music, MusicProperty.ID>
    >(
      `
        select id from music
          where createUserId = ?
            and createTimestamp > ? and createTimestamp < ?
      `,
      [ctx.user.id, now.startOf('day'), now.endOf('day')],
    );
    if (todayCreateMusicList.length > ctx.user.createMusicMaxAmountPerDay) {
      return ctx.except(ExceptionCode.OVER_CREATE_MUSIC_TIMES_PER_DAY);
    }
  }

  const id = generateRandomString(ID_LENGTH, false);
  await getDB().run(
    `
      insert into music ( id, type, name, sq, createUserId, createTimestamp )
        values( ?, ?, ?, ?, ?, ? )
    `,
    [id, type, name, sq, ctx.user.id, Date.now()],
  );
  await getDB().run(
    `
      insert into music_singer_relation ( musicId, singerId )
        values ${singerIdList.map(() => '( ?, ? )').join(', ')}
    `,
    singerIdList.map((singerId) => [id, singerId]).flat(Infinity),
  );

  return ctx.success(id);
};
