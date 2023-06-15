import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { Response } from '#/server/api/search_singer';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/singer';
import { ExceptionCode } from '#/constants/exception';
import { getDB } from '@/db';
import {
  MUSIC_SINGER_RELATION_TABLE_NAME,
  MusicSingerRelationProperty,
  SINGER_TABLE_NAME,
  Singer,
  SingerProperty,
} from '@/constants/db_definition';
import { getAssetPublicPath } from '@/platform/asset';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 100;
type LocalSinger = Pick<
  Singer,
  | SingerProperty.ID
  | SingerProperty.AVATAR
  | SingerProperty.NAME
  | SingerProperty.ALIASES
> & { musicCount: number };

export default async (ctx: Context) => {
  const { keyword, page, pageSize } = ctx.request.query as {
    keyword?: unknown;
    page?: unknown;
    pageSize?: unknown;
  };
  const pageNumber = page ? Number(page) : undefined;
  const pageSizeNumber = pageSize ? Number(pageSize) : undefined;
  if (
    typeof keyword !== 'string' ||
    keyword.includes(ALIAS_DIVIDER) ||
    keyword.length > SEARCH_KEYWORD_MAX_LENGTH ||
    typeof pageNumber !== 'number' ||
    !pageNumber ||
    pageNumber < 0 ||
    typeof pageSizeNumber !== 'number' ||
    !pageSizeNumber ||
    pageSizeNumber < 0 ||
    pageSizeNumber > MAX_PAGE_SIZE
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  let total: number;
  let singerList: LocalSinger[];
  if (keyword.length) {
    const pattern = `%${keyword}%`;
    const results = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT
            count(*) AS value
          FROM ${SINGER_TABLE_NAME}
          WHERE ${SingerProperty.NAME} LIKE ?
            OR ${SingerProperty.ALIASES} LIKE ?
        `,
        [pattern, pattern],
      ),
      getDB().all<LocalSinger>(
        `
          SELECT
            s.${SingerProperty.ID},
            s.${SingerProperty.AVATAR},
            s.${SingerProperty.NAME},
            s.${SingerProperty.ALIASES},
            count(msr.${MusicSingerRelationProperty.ID}) AS musicCount
          FROM ${SINGER_TABLE_NAME} AS s
          LEFT JOIN ${MUSIC_SINGER_RELATION_TABLE_NAME} AS msr
            ON s.${SingerProperty.ID} = msr.${MusicSingerRelationProperty.SINGER_ID}
          WHERE s.${SingerProperty.NAME} LIKE ? or s.${SingerProperty.ALIASES} LIKE ?
          GROUP BY s.${SingerProperty.ID}
          ORDER BY musicCount DESC
          LIMIT ?
          OFFSET ?
        `,
        [pattern, pattern, pageSizeNumber, pageSizeNumber * (pageNumber - 1)],
      ),
    ]);
    total = results[0]!.value;
    [, singerList] = results;
  } else {
    const results = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT count(*) as value FROM ${SINGER_TABLE_NAME}
        `,
        [],
      ),
      getDB().all<LocalSinger>(
        `
          SELECT
            s.${SingerProperty.ID},
            s.${SingerProperty.AVATAR},
            s.${SingerProperty.NAME},
            s.${SingerProperty.ALIASES},
            count(msr.id) AS musicCount
          FROM ${SINGER_TABLE_NAME} AS s
          LEFT JOIN ${MUSIC_SINGER_RELATION_TABLE_NAME} AS msr
            ON s.${SingerProperty.ID} = msr.${MusicSingerRelationProperty.SINGER_ID}
          GROUP BY s.${SingerProperty.ID}
          ORDER BY random()
          LIMIT ?
        `,
        [pageSizeNumber],
      ),
    ]);
    total = Math.min(results[0]!.value, pageSizeNumber);
    [, singerList] = results;
  }

  return ctx.success<Response>({
    total,
    singerList: singerList.map((singer) => ({
      ...singer,
      aliases: singer.aliases ? singer.aliases.split(ALIAS_DIVIDER) : [],
      avatar: getAssetPublicPath(singer.avatar, AssetType.SINGER_AVATAR),
    })),
  });
};
