import { ExceptionCode } from '#/constants/exception';
import { Response } from '#/server/api/get_public_musicbill_collection_list';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/musicbill';
import excludeProperty from '#/utils/exclude_property';
import {
  PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME,
  MUSICBILL_TABLE_NAME,
  Musicbill,
  PublicMusicbillCollectionProperty,
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
type Collection = Pick<
  Musicbill,
  | MusicbillProperty.ID
  | MusicbillProperty.NAME
  | MusicbillProperty.COVER
  | MusicbillProperty.USER_ID
> & {
  collectTimestamp: number;
};
type LocalUser = Pick<User, UserProperty.ID | UserProperty.NICKNAME>;

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
  let collectionList: Collection[];
  if (keyword.length) {
    const pattern = `%${keyword}%`;
    const results = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT
            count(mc.${PublicMusicbillCollectionProperty.ID}) AS value
          FROM ${PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME} AS mc
          LEFT JOIN ${MUSICBILL_TABLE_NAME} AS m
            ON mc.${PublicMusicbillCollectionProperty.MUSICBILL_ID} = m.${MusicbillProperty.ID}
          WHERE m.${MusicbillProperty.PUBLIC} = 1
            AND m.${MusicbillProperty.NAME} LIKE ?
            AND mc.${MusicbillProperty.USER_ID} = ?
        `,
        [pattern, ctx.user.id],
      ),
      getDB().all<Collection>(
        `
          SELECT
            m.${MusicbillProperty.ID},
            m.${MusicbillProperty.NAME},
            m.${MusicbillProperty.COVER},
            m.${MusicbillProperty.USER_ID},
            mc.${PublicMusicbillCollectionProperty.COLLECT_TIMESTAMP}
          FROM ${PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME} AS mc
          LEFT JOIN ${MUSICBILL_TABLE_NAME} AS m
            ON m.${MusicbillProperty.ID} = mc.${PublicMusicbillCollectionProperty.MUSICBILL_ID}
          WHERE m.${MusicbillProperty.PUBLIC} = 1
            AND m.${MusicbillProperty.NAME} LIKE ?
            AND mc.${PublicMusicbillCollectionProperty.USER_ID} = ?
          ORDER BY mc.${PublicMusicbillCollectionProperty.COLLECT_TIMESTAMP} DESC
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
    [, collectionList] = results;
  } else {
    const results = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT
            count(mc.${PublicMusicbillCollectionProperty.ID}) AS value
          FROM ${PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME} AS mc
          LEFT JOIN ${MUSICBILL_TABLE_NAME} AS m
            ON mc.${PublicMusicbillCollectionProperty.MUSICBILL_ID} = m.${MusicbillProperty.ID}
          WHERE m.${MusicbillProperty.PUBLIC} = 1
            AND mc.${MusicbillProperty.USER_ID} = ?
        `,
        [ctx.user.id],
      ),
      getDB().all<Collection>(
        `
          SELECT
            m.${MusicbillProperty.ID},
            m.${MusicbillProperty.NAME},
            m.${MusicbillProperty.COVER},
            m.${MusicbillProperty.USER_ID},
            mc.${PublicMusicbillCollectionProperty.COLLECT_TIMESTAMP}
          FROM ${PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME} AS mc
          LEFT JOIN ${MUSICBILL_TABLE_NAME} AS m
            ON m.${MusicbillProperty.ID} = mc.${PublicMusicbillCollectionProperty.MUSICBILL_ID}
          WHERE m.${MusicbillProperty.PUBLIC} = 1
            AND mc.${PublicMusicbillCollectionProperty.USER_ID} = ?
          ORDER BY mc.${PublicMusicbillCollectionProperty.COLLECT_TIMESTAMP} DESC
          LIMIT ?
          OFFSET ?
        `,
        [ctx.user.id, pageSizeNumber, pageSizeNumber * (pageNumber - 1)],
      ),
    ]);

    total = results[0]!.value;
    [, collectionList] = results;
  }

  let userList: LocalUser[] = [];
  if (collectionList.length) {
    userList = await getUserListByIds(
      Array.from(new Set(collectionList.map((mb) => mb.userId))),
      [UserProperty.ID, UserProperty.NICKNAME],
    );
  }

  return ctx.success<Response>({
    total,
    collectionList: collectionList.map((mb) => ({
      ...excludeProperty(mb, [MusicbillProperty.USER_ID]),
      user: userList.find((u) => u.id === mb.userId)!,
      cover: getAssetPublicPath(mb.cover, AssetType.MUSICBILL_COVER),
    })),
  });
};
