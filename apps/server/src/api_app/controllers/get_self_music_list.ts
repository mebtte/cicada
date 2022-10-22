import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import excludeProperty from '#/utils/exclude_property';
import db from '@/db';
import { Music, Property as MusicProperty } from '@/db/music';
import {
  getSingerListInMusicIds,
  Singer,
  Property as SingerProperty,
} from '@/db/singer';
import { getAssetUrl } from '@/platform/asset';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 50;
type LocalMusic = Pick<
  Music,
  | MusicProperty.ID
  | MusicProperty.TYPE
  | MusicProperty.NAME
  | MusicProperty.ALIASES
  | MusicProperty.COVER
  | MusicProperty.SQ
  | MusicProperty.HQ
  | MusicProperty.AC
>;

export default async (ctx: Context) => {
  const { keyword, page, pageSize } = ctx.query;
  const pageNumber = page ? Number(page) : undefined;
  const pageSizeNumber = pageSize ? Number(pageSize) : undefined;

  if (
    typeof keyword !== 'string' ||
    keyword.length > SEARCH_KEYWORD_MAX_LENGTH ||
    !pageNumber ||
    pageNumber < 1 ||
    !pageSizeNumber ||
    pageSizeNumber < 1 ||
    pageSizeNumber > MAX_PAGE_SIZE
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  let total: number;
  let musicList: LocalMusic[];
  if (keyword.length) {
    const pattern = `%${keyword}%`;
    const musicPatternSQL = `
      SELECT id FROM music
        WHERE createUserId = ?
          AND (name LIKE ? OR aliases LIKE ?)
    `;
    const singerPatternSQL = `
      SELECT msr.musicId FROM music_singer_relation AS msr
        LEFT JOIN singer as s ON msr.singerId = s.id
        LEFT JOIN music as m ON msr.musicId = m.id
        WHERE (m.createUserId = ?)
          AND (s.name LIKE ? OR s.aliases LIKE ?)
    `;
    const [totalObject, localMusicList] = await Promise.all([
      db.get<{ value: number }>(
        `
          SELECT count(*) as value FROM music
            WHERE id IN (${musicPatternSQL}) OR id IN (${singerPatternSQL})
        `,
        [ctx.user.id, pattern, pattern, ctx.user.id, pattern, pattern],
      ),
      db.all<LocalMusic>(
        `
          SELECT
            id,
            type,
            name,
            aliases,
            cover,
            sq,
            hq,
            ac
          FROM music
            WHERE id IN (${musicPatternSQL}) OR id IN (${singerPatternSQL})
            ORDER BY createTimestamp DESC
            LIMIT ? OFFSET ?
        `,
        [
          ctx.user.id,
          pattern,
          pattern,
          ctx.user.id,
          pattern,
          pattern,
          pageSizeNumber,
          (pageNumber - 1) * pageSizeNumber,
        ],
      ),
    ]);

    total = totalObject!.value;
    musicList = localMusicList;
  } else {
    const [totalObject, localMusicList] = await Promise.all([
      db.get<{ value: number }>(
        `
          SELECT count(*) AS value FROM music
            WHERE createUserId = ?
        `,
        [ctx.user.id],
      ),
      db.all<LocalMusic>(
        `
          SELECT
            id,
            type,
            name,
            aliases,
            cover,
            sq,
            hq,
            ac
          FROM music
            WHERE createUserId = ?
            ORDER BY createTimestamp DESC
            LIMIT ? OFFSET ?
        `,
        [ctx.user.id, pageSizeNumber, (pageNumber - 1) * pageSizeNumber],
      ),
    ]);
    total = totalObject!.value;
    musicList = localMusicList;
  }

  if (!musicList.length) {
    return ctx.success({
      total,
      musicList: [],
    });
  }

  const singerList = await getSingerListInMusicIds(
    musicList.map((m) => m.id),
    [
      SingerProperty.ID,
      SingerProperty.AVATAR,
      SingerProperty.NAME,
      SingerProperty.ALIASES,
    ],
  );
  const musicIdMapSingerList: {
    [key: string]: (Pick<
      Singer,
      SingerProperty.ID | SingerProperty.AVATAR | SingerProperty.NAME
    > & {
      aliases: string[];
    })[];
  } = {};
  singerList.forEach((s) => {
    if (!musicIdMapSingerList[s.musicId]) {
      musicIdMapSingerList[s.musicId] = [];
    }
    musicIdMapSingerList[s.musicId].push({
      ...excludeProperty(s, ['musicId']),
      avatar: getAssetUrl(s.avatar, AssetType.SINGER_AVATAR),
      aliases: s.aliases ? s.aliases.split(ALIAS_DIVIDER) : [],
    });
  });

  return ctx.success({
    total,
    musicList: musicList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      cover: getAssetUrl(m.cover, AssetType.MUSIC_COVER),
      sq: getAssetUrl(m.sq, AssetType.MUSIC_SQ),
      hq: getAssetUrl(m.hq, AssetType.MUSIC_HQ),
      ac: getAssetUrl(m.ac, AssetType.MUSIC_AC),
      singers: musicIdMapSingerList[m.id] || [],
    })),
  });
};
