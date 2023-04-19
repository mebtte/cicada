import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/musicbill';
import excludeProperty from '#/utils/exclude_property';
import { User, UserProperty } from '@/constants/db_definition';
import { getDB } from '@/db';
import { Musicbill, Property as MusicbillProperty } from '@/db/musicbill';
import { getUserListByIds } from '@/db/user';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 100;
type LocalMusicbill = Pick<
  Musicbill,
  | MusicbillProperty.ID
  | MusicbillProperty.COVER
  | MusicbillProperty.NAME
  | MusicbillProperty.USER_ID
>;
type LocalUser = Pick<
  User,
  UserProperty.ID | UserProperty.AVATAR | UserProperty.NICKNAME
>;

export default async (ctx: Context) => {
  const { keyword, page, pageSize } = ctx.request.query as {
    keyword: unknown;
    page: unknown;
    pageSize: unknown;
  };
  const pageNumber = page ? Number(page) : undefined;
  const pageSizeNumber = pageSize ? Number(pageSize) : undefined;
  if (
    typeof keyword !== 'string' ||
    keyword.length > SEARCH_KEYWORD_MAX_LENGTH ||
    !pageNumber ||
    pageNumber < 0 ||
    !pageSizeNumber ||
    pageSizeNumber < 0 ||
    pageSizeNumber > MAX_PAGE_SIZE
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  let total: number;
  let musicbillList: LocalMusicbill[];
  if (keyword) {
    const pattern = `%${keyword}%`;
    const results = await Promise.all([
      getDB().get<{
        value: number;
      }>(
        `
          SELECT
            count(*) AS value
          FROM musicbill
          WHERE public = 1
            AND name LIKE ?
        `,
        [pattern],
      ),
      getDB().all<LocalMusicbill>(
        `
          SELECT
            m.id,
            m.cover,
            m.name,
            m.userId,
            count(mm.id) AS musicCount
          FROM musicbill AS m
          LEFT JOIN musicbill_music AS mm
            ON m.id = mm.musicbillId
          LEFT JOIN musicbill_collection AS mc
            ON mc.musicbillId = m.id
          WHERE m.public = 1
            AND m.name LIKE ?
          GROUP BY m.id
          ORDER BY count(mc.id) DESC
          LIMIT ?
        `,
        [pattern, pageSizeNumber],
      ),
    ]);

    total = results[0]!.value;
    [, musicbillList] = results;
  } else {
    const results = await Promise.all([
      getDB().get<{
        value: number;
      }>(
        `
          SELECT
            count(*) AS value
          FROM musicbill
          WHERE public = 1
        `,
        [],
      ),
      getDB().all<LocalMusicbill>(
        `
          SELECT
            m.id,
            m.cover,
            m.name,
            m.userId,
            count(mm.id) AS musicCount
          FROM musicbill AS m
          LEFT JOIN musicbill_music AS mm
            ON m.id = mm.musicbillId
          WHERE m.public = 1
          GROUP BY m.id
          ORDER BY random()
          LIMIT ?
        `,
        [pageSizeNumber],
      ),
    ]);

    total = Math.min(results[0]!.value, pageSizeNumber);
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
    musicbillList: musicbillList.map((mb) => {
      const user = userList.find((u) => u.id === mb.userId);
      return {
        ...excludeProperty(mb, [MusicbillProperty.USER_ID]),
        user,
      };
    }),
  });
};
