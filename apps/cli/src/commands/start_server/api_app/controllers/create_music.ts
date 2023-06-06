import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { NAME_MAX_LENGTH, MUSIC_TYPES, MusicType } from '#/constants/music';
import exist from '#/utils/exist';
import { getSingerListByIds } from '@/db/singer';
import { getAssetFilePath } from '@/platform/asset';
import { getDB } from '@/db';
import day from '#/utils/day';
import createMusic from '@/db/create_music';
import {
  MUSIC_SINGER_RELATION_TABLE_NAME,
  MUSIC_TABLE_NAME,
  Music,
  MusicProperty,
  MusicSingerRelationProperty,
  SingerProperty,
} from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { name, singerIds, type, asset } = ctx.request.body as {
    name?: unknown;
    singerIds?: unknown;
    type?: unknown;
    asset?: unknown;
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
    typeof asset !== 'string'
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const assetExist = await exist(getAssetFilePath(asset, AssetType.MUSIC));
  if (!assetExist) {
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
        SELECT
          ${MusicProperty.ID}
        FROM ${MUSIC_TABLE_NAME}
        WHERE ${MusicProperty.CREATE_USER_ID} = ?
          AND ${MusicProperty.CREATE_TIMESTAMP} > ?
      `,
      [ctx.user.id, now.startOf('day')],
    );
    if (todayCreateMusicList.length > ctx.user.createMusicMaxAmountPerDay) {
      return ctx.except(ExceptionCode.OVER_CREATE_MUSIC_TIMES_PER_DAY);
    }
  }

  const id = await createMusic({
    name,
    type: type as MusicType,
    createUserId: ctx.user.id,
    asset,
  });
  await getDB().run(
    `
      INSERT INTO ${MUSIC_SINGER_RELATION_TABLE_NAME} ( ${
      MusicSingerRelationProperty.MUSIC_ID
    }, ${MusicSingerRelationProperty.SINGER_ID} )
      VALUES ${singerIdList.map(() => '( ?, ? )').join(', ')}
    `,
    singerIdList.map((singerId) => [id, singerId]).flat(Infinity),
  );

  return ctx.success(id);
};
