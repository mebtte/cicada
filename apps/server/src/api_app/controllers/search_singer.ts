import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/singer';
import { ExceptionCode } from '#/constants/exception';
import db from '@/db';
import { Singer, Property as SingerProperty } from '@/db/singer';
import { getAssetUrl } from '@/platform/asset';
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
      db.get<{ value: number }>(
        `
          SELECT count(*) AS value FROM singer
          WHERE name LIKE ? OR aliases LIKE ?
        `,
        [pattern, pattern],
      ),
      db.all<LocalSinger>(
        `
          SELECT
            s.id,
            s.avatar,
            s.name,
            s.aliases,
            count(msr.id) AS musicCount
          FROM singer AS s
          LEFT JOIN music_singer_relation AS msr
            ON s.id = msr.singerId
          WHERE name LIKE ? or aliases LIKE ?
          GROUP BY s.id
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
      db.get<{ value: number }>(
        `
          SELECT count(*) as value FROM singer
        `,
        [],
      ),
      db.all<LocalSinger>(
        `
          SELECT
            s.id,
            s.avatar,
            s.name,
            s.aliases,
            count(msr.id) AS musicCount
          FROM singer AS s
          LEFT JOIN music_singer_relation AS msr
            ON s.id = msr.singerId
          GROUP BY s.id
          ORDER BY random()
          LIMIT ?
        `,
        [pageSizeNumber],
      ),
    ]);
    total = Math.min(results[0]!.value, pageSizeNumber);
    [, singerList] = results;
  }

  return ctx.success({
    total,
    singerList: singerList.map((singer) => ({
      ...singer,
      avatar: getAssetUrl(singer.avatar, AssetType.SINGER_AVATAR),
      aliases: singer.aliases ? singer.aliases.split(ALIAS_DIVIDER) : [],
    })),
  });
};
