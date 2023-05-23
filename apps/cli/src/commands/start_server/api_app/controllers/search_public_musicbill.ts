import { ExceptionCode } from '#/constants/exception';
import SearchPublicMusicbill from '#/response_data/api/search_public_musicbill';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/musicbill';
import excludeProperty from '#/utils/exclude_property';
import {
  MUSICBILL_COLLECTION_TABLE_NAME,
  MUSICBILL_MUSIC_TABLE_NAME,
  MUSICBILL_TABLE_NAME,
  Musicbill,
  MusicbillCollectionProperty,
  MusicbillMusicProperty,
  MusicbillProperty,
  User,
  UserProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getUserListByIds } from '@/db/user';
import { getAssetPublicPath } from '@/platform/asset';
import { AssetType } from '#/constants';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 100;
type LocalMusicbill = Pick<
  Musicbill,
  | MusicbillProperty.ID
  | MusicbillProperty.COVER
  | MusicbillProperty.NAME
  | MusicbillProperty.USER_ID
> & {
  musicCount: number;
  collectionCount: number;
};
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
          FROM ${MUSICBILL_TABLE_NAME}
          WHERE ${MusicbillProperty.PUBLIC} = 1
            AND ${MusicbillProperty.NAME} LIKE ?
        `,
        [pattern],
      ),
      getDB().all<LocalMusicbill>(
        `
          SELECT
            m.${MusicbillProperty.ID},
            m.${MusicbillProperty.COVER},
            m.${MusicbillProperty.NAME},
            m.${MusicbillProperty.USER_ID},
            count(DISTINCT mm.${MusicbillMusicProperty.ID}) AS musicCount,
            count(DISTINCT mc.${MusicbillCollectionProperty.ID}) AS collectionCount
          FROM ${MUSICBILL_TABLE_NAME} AS m
          LEFT JOIN ${MUSICBILL_MUSIC_TABLE_NAME} AS mm
            ON m.${MusicbillProperty.ID} = mm.${MusicbillMusicProperty.MUSICBILL_ID}
          LEFT JOIN ${MUSICBILL_COLLECTION_TABLE_NAME} AS mc
            ON mc.${MusicbillCollectionProperty.MUSICBILL_ID} = m.${MusicbillProperty.ID}
          WHERE m.${MusicbillProperty.PUBLIC} = 1
            AND m.${MusicbillProperty.NAME} LIKE ?
          GROUP BY m.${MusicbillProperty.ID}
          ORDER BY collectionCount DESC
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
          FROM ${MUSICBILL_TABLE_NAME}
          WHERE ${MusicbillProperty.PUBLIC} = 1
        `,
        [],
      ),
      getDB().all<LocalMusicbill>(
        `
          SELECT
            m.${MusicbillProperty.ID},
            m.${MusicbillProperty.COVER},
            m.${MusicbillProperty.NAME},
            m.${MusicbillProperty.USER_ID},
            count(DISTINCT mm.${MusicbillMusicProperty.ID}) AS musicCount,
            count(DISTINCT mc.${MusicbillCollectionProperty.ID}) AS collectionCount
          FROM ${MUSICBILL_TABLE_NAME} AS m
          LEFT JOIN ${MUSICBILL_MUSIC_TABLE_NAME} AS mm
            ON m.${MusicbillProperty.ID} = mm.${MusicbillMusicProperty.MUSICBILL_ID}
          LEFT JOIN ${MUSICBILL_COLLECTION_TABLE_NAME} AS mc
            ON mc.${MusicbillCollectionProperty.MUSICBILL_ID} = m.${MusicbillProperty.ID}
          WHERE m.${MusicbillProperty.PUBLIC} = 1
          GROUP BY m.${MusicbillProperty.ID}
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
    userList = userList.map((u) => ({
      ...u,
      avatar: getAssetPublicPath(u.avatar, AssetType.USER_AVATAR),
    }));
  }

  return ctx.success<SearchPublicMusicbill>({
    total,
    musicbillList: musicbillList.map((mb) => {
      const user = userList.find((u) => u.id === mb.userId)!;
      return {
        ...excludeProperty(mb, [MusicbillProperty.USER_ID]),
        cover: getAssetPublicPath(mb.cover, AssetType.MUSICBILL_COVER),
        user,
      };
    }),
  });
};
