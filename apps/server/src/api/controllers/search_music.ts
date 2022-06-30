import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import db from '@/db';
import { Music, Property as MusicProperty } from '@/db/music';
import {
  Singer,
  getSingerListInMusicIds,
  Property as SingerProperty,
} from '@/db/singer';
import { getUserListByIds, Property as UserProperty } from '@/db/user';
import excludeProperty from '#/utils/exclude_property';
import { getAssetUrl } from '@/platform/asset';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 50;

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
    !keyword.length ||
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

  const pattern = `%${keyword}%`;
  const musicPatternSQL = `
    SELECT id FROM  music 
      WHERE name LIKE ? 
        OR aliases LIKE ?
  `;
  const sinegrPatternSQL = `
    SELECT msr.musicId FROM music_singer_relation AS msr
      LEFT JOIN singer AS s ON msr.singerId = s.id 
      WHERE
        s.name LIKE ?
        OR s.aliases LIKE ?
  `;
  const total = await db.get<{ value: number }>(
    `
      SELECT count(*) as value FROM music 
        WHERE id IN ( ${musicPatternSQL} ) OR id IN ( ${sinegrPatternSQL} )
    `,
    [pattern, pattern, pattern, pattern],
  );
  if (!total!.value) {
    return ctx.success({
      total: 0,
      musicList: [],
    });
  }

  const musicList = await db.all<
    Pick<
      Music,
      | MusicProperty.ID
      | MusicProperty.TYPE
      | MusicProperty.NAME
      | MusicProperty.ALIASES
      | MusicProperty.COVER
      | MusicProperty.SQ
      | MusicProperty.HQ
      | MusicProperty.AC
      | MusicProperty.CREATE_USER_ID
    >
  >(
    `
    select
      id,
      type,
      name,
      aliases,
      cover,
      sq,
      hq,
      ac,
      createUserId
    from music
      where id in ( ${musicPatternSQL} ) or id in ( ${sinegrPatternSQL} )
      order by effectivePlayTimes desc
      limit ? offset ?
  `,
    [
      pattern,
      pattern,
      pattern,
      pattern,
      pageSizeNumber,
      pageSizeNumber * (pageNumber - 1),
    ],
  );
  if (!musicList.length) {
    return ctx.success({
      total: total!.value,
      musicList: [],
    });
  }

  const [userList, singerList] = await Promise.all([
    getUserListByIds(
      Array.from(new Set(musicList.map((m) => m.createUserId))),
      [UserProperty.ID, UserProperty.NICKNAME, UserProperty.AVATAR],
    ),
    getSingerListInMusicIds(
      musicList.map((m) => m.id),
      [
        SingerProperty.ID,
        SingerProperty.AVATAR,
        SingerProperty.NAME,
        SingerProperty.ALIASES,
      ],
    ),
  ]);

  const userMap: {
    [key: string]: typeof userList[0];
  } = {};
  userList.forEach((user) => {
    userMap[user.id] = {
      ...user,
      avatar: getAssetUrl(user.avatar, AssetType.USER_AVATAR),
    };
  });

  const musicIdMapSinger: {
    [key: string]: Pick<
      Singer,
      | SingerProperty.ID
      | SingerProperty.AVATAR
      | SingerProperty.NAME
      | SingerProperty.ALIASES
    >[];
  } = {};
  singerList.forEach((s) => {
    if (!musicIdMapSinger[s.musicId]) {
      musicIdMapSinger[s.musicId] = [];
    }
    musicIdMapSinger[s.musicId].push({
      ...excludeProperty(s, ['musicId']),
      avatar: getAssetUrl(s.avatar, AssetType.SINGER_AVATAR),
    });
  });

  return ctx.success({
    total: total!.value,
    musicList: musicList.map((m) => ({
      ...excludeProperty(m, [MusicProperty.CREATE_USER_ID]),
      cover: getAssetUrl(m.cover, AssetType.MUSIC_COVER),
      sq: getAssetUrl(m.sq, AssetType.MUSIC_SQ),
      hq: getAssetUrl(m.hq, AssetType.MUSIC_HQ),
      ac: getAssetUrl(m.ac, AssetType.MUSIC_AC),
      singers: musicIdMapSinger[m.id] || [],
      createUser: userMap[m.createUserId],
    })),
  });
};
