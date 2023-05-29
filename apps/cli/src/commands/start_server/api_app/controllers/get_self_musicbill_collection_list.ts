import { ExceptionCode } from '#/constants/exception';
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
            count(mc.${MusicbillCollectionProperty.ID}) AS value
          FROM ${MUSICBILL_COLLECTION_TABLE_NAME} AS mc
          LEFT JOIN ${MUSICBILL_TABLE_NAME} AS m
            ON mc.${MusicbillCollectionProperty.MUSICBILL_ID} = m.${MusicbillProperty.ID}
          WHERE m.${MusicbillProperty.PUBLIC} = 1
            AND m.${MusicbillProperty.NAME} LIKE ?
            AND mc.${MusicbillProperty.USER_ID} = ?
        `,
        [pattern, ctx.user.id],
      ),
      getDB().all<LocalMusicbill>(
        `
          SELECT
            m.${MusicbillProperty.ID},
            m.${MusicbillProperty.NAME},
            m.${MusicbillProperty.COVER},
            m.${MusicbillProperty.USER_ID},
            count(mm.${MusicbillMusicProperty.ID}) AS musicCount,
            mc.${MusicbillCollectionProperty.COLLECT_TIMESTAMP}
          FROM ${MUSICBILL_COLLECTION_TABLE_NAME} AS mc
          LEFT JOIN ${MUSICBILL_TABLE_NAME} AS m
            ON m.${MusicbillProperty.ID} = mc.${MusicbillCollectionProperty.MUSICBILL_ID}
          LEFT JOIN ${MUSICBILL_MUSIC_TABLE_NAME} AS mm
            ON mm.${MusicbillMusicProperty.MUSICBILL_ID} = mc.${MusicbillCollectionProperty.MUSICBILL_ID}
          WHERE m.${MusicbillProperty.PUBLIC} = 1
            AND m.${MusicbillProperty.NAME} LIKE ?
            AND mc.${MusicbillCollectionProperty.USER_ID} = ?
          GROUP BY mc.${MusicbillCollectionProperty.MUSICBILL_ID}
          ORDER BY mc.${MusicbillCollectionProperty.COLLECT_TIMESTAMP} DESC
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
            count(mc.${MusicbillCollectionProperty.ID}) AS value
          FROM ${MUSICBILL_COLLECTION_TABLE_NAME} AS mc
          LEFT JOIN ${MUSICBILL_TABLE_NAME} AS m
            ON mc.${MusicbillCollectionProperty.MUSICBILL_ID} = m.${MusicbillProperty.ID}
          WHERE m.${MusicbillProperty.PUBLIC} = 1
            AND mc.${MusicbillProperty.USER_ID} = ?
        `,
        [ctx.user.id],
      ),
      getDB().all<LocalMusicbill>(
        `
          SELECT
            m.${MusicbillProperty.ID},
            m.${MusicbillProperty.NAME},
            m.${MusicbillProperty.COVER},
            m.${MusicbillProperty.USER_ID},
            count(mm.${MusicbillMusicProperty.ID}) AS musicCount,
            mc.${MusicbillCollectionProperty.COLLECT_TIMESTAMP}
          FROM ${MUSICBILL_COLLECTION_TABLE_NAME} AS mc
          LEFT JOIN ${MUSICBILL_TABLE_NAME} AS m
            ON m.${MusicbillProperty.ID} = mc.${MusicbillCollectionProperty.MUSICBILL_ID}
          LEFT JOIN ${MUSICBILL_MUSIC_TABLE_NAME} AS mm
            ON mm.${MusicbillMusicProperty.MUSICBILL_ID} = mc.${MusicbillCollectionProperty.MUSICBILL_ID}
          WHERE m.${MusicbillProperty.PUBLIC} = 1
            AND mc.${MusicbillCollectionProperty.USER_ID} = ?
          GROUP BY mc.${MusicbillCollectionProperty.MUSICBILL_ID}
          ORDER BY mc.${MusicbillCollectionProperty.COLLECT_TIMESTAMP} DESC
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
    userList = userList.map((u) => ({
      ...u,
      avatar: getAssetPublicPath(u.avatar, AssetType.USER_AVATAR),
    }));
  }

  return ctx.success({
    total,
    musicbillList: musicbillList.map((mb) => ({
      ...excludeProperty(mb, [MusicbillProperty.USER_ID]),
      user: userList.find((u) => u.id === mb.userId),
      cover: getAssetPublicPath(mb.cover, AssetType.MUSICBILL_COVER),
    })),
  });
};
