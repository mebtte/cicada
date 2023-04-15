import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/musicbill';
import excludeProperty from '#/utils/exclude_property';
import { getDB } from '@/db';
import { Musicbill, Property as MusicbillProperty } from '@/db/musicbill';
import { User, Property as UserProperty, getUserListByIds } from '@/db/user';
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
      getDB().get<{ value: number }>(
        `
          SELECT
            count(mc.id) AS value
          FROM musicbill_collection AS mc
          LEFT JOIN musicbill AS m
            ON mc.musicbillId = m.id
          WHERE m.public = 1
            AND m.name LIKE ?
            AND mc.userId = ?
        `,
        [pattern, ctx.user.id],
      ),
      getDB().all<LocalMusicbill>(
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
            AND mc.userId = ?
          GROUP BY mc.musicbillId
          ORDER BY mc.collectTimestamp DESC
          LIMIT ?
          OFFSET ?
        `,
        [
          pattern,
          ctx.user.id,
          pageSizeNumber,
          pageSizeNumber * (pageNumber - 1),
        ],
      ),
    ]);

    total = results[0]!.value;
    [, musicbillList] = results;
  } else {
    const results = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT
            count(mc.id) AS value
          FROM musicbill_collection AS mc
          LEFT JOIN musicbill AS m
            ON mc.musicbillId = m.id
          WHERE m.public = 1
            AND mc.userId = ?
        `,
        [ctx.user.id],
      ),
      getDB().all<LocalMusicbill>(
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
            AND mc.userId = ?
          GROUP BY mc.musicbillId
          ORDER BY mc.collectTimestamp DESC
          LIMIT ?
          OFFSET ?
        `,
        [ctx.user.id, pageSizeNumber, pageSizeNumber * (pageNumber - 1)],
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
  }

  return ctx.success({
    total,
    musicbillList: musicbillList.map((mb) => ({
      ...excludeProperty(mb, [MusicbillProperty.USER_ID]),
      user: userList.find((u) => u.id === mb.userId),
    })),
  });
};
