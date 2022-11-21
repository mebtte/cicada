import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/musicbill';
import excludeProperty from '#/utils/exclude_property';
import db from '@/db';
import { Musicbill, Property as MusicbillProperty } from '@/db/musicbill';
import { User, Property as UserProperty, getUserListByIds } from '@/db/user';
import { getAssetUrl } from '@/platform/asset';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 100;
type LocalMusicbill = Pick<
  Musicbill,
  | MusicbillProperty.ID
  | MusicbillProperty.NAME
  | MusicbillProperty.COVER
  | MusicbillProperty.USER_ID
> & {
  musicCount: number;
  collectTimestamp: number;
};
type LocalUser = Pick<
  User,
  UserProperty.AVATAR | UserProperty.ID | UserProperty.NICKNAME
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
  let musicbillList: LocalMusicbill[];
  if (keyword.length) {
    const pattern = `%${keyword}%`;
    const results = await Promise.all([
      db.get<{ value: number }>(
        `
          SELECT
            count(mc.id) AS value
          FROM musicbill_collection AS mc
          LEFT JOIN musicbill AS m
            ON mc.musicbillId = m.id
          WHERE m.public = 1
            AND m.name LIKE ?
        `,
        [pattern],
      ),
      db.all<LocalMusicbill>(
        `
          SELECT
            m.id,
            m.name,
            m.cover,
            m.userId,
            count(mm.id) AS musicCount,
            mc.collectTimestamp
          FROM musicbill_collection AS mc
          LEFT JOIN musicbill AS m
            ON m.id = mc.musicbillId
          LEFT JOIN musicbill_music AS mm
            ON mm.musicbillId = mc.musicbillId
          WHERE m.public = 1
            AND m.name LIKE ?
          GROUP BY mc.musicbillId
          ORDER BY mc.collectTimestamp DESC
          LIMIT ?
          OFFSET ?
        `,
        [pattern, pageSizeNumber, pageSizeNumber * (pageNumber - 1)],
      ),
    ]);

    total = results[0]!.value;
    [, musicbillList] = results;
  } else {
    const results = await Promise.all([
      db.get<{ value: number }>(
        `
          SELECT
            count(mc.id) AS value
          FROM musicbill_collection AS mc
          LEFT JOIN musicbill AS m
            ON mc.musicbillId = m.id
          WHERE m.public = 1
        `,
        [],
      ),
      db.all<LocalMusicbill>(
        `
          SELECT
            m.id,
            m.name,
            m.cover,
            m.userId,
            count(mm.id) AS musicCount,
            mc.collectTimestamp
          FROM musicbill_collection AS mc
          LEFT JOIN musicbill AS m
            ON m.id = mc.musicbillId
          LEFT JOIN musicbill_music AS mm
            ON mm.musicbillId = mc.musicbillId
          WHERE m.public = 1
          GROUP BY mc.musicbillId
          ORDER BY mc.collectTimestamp DESC
          LIMIT ?
          OFFSET ?
        `,
        [pageSizeNumber, pageSizeNumber * (pageNumber - 1)],
      ),
    ]);

    total = results[0]!.value;
    [, musicbillList] = results;
  }

  let userList: LocalUser[] = [];
  if (musicbillList.length) {
    userList = await getUserListByIds(
      Array.from(new Set(musicbillList.map((mb) => mb.userId))),
      [UserProperty.ID, UserProperty.AVATAR, UserProperty.NICKNAME],
    );
    userList = userList.map((u) => ({
      ...u,
      avatar: getAssetUrl(u.avatar, AssetType.USER_AVATAR),
    }));
  }

  return ctx.success({
    total,
    musicbillList: musicbillList.map((mb) => ({
      ...excludeProperty(mb, [MusicbillProperty.USER_ID]),
      cover: getAssetUrl(mb.cover, AssetType.MUSICBILL_COVER),
      user: userList.find((u) => u.id === mb.userId),
    })),
  });
};
