import { ALIAS_DIVIDER } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import excludeProperty from '#/utils/exclude_property';
import {
  MUSIC_PLAY_RECORD_TABLE_NAME,
  MUSIC_SINGER_RELATION_TABLE_NAME,
  MUSIC_TABLE_NAME,
  Music,
  MusicPlayRecordProperty,
  MusicProperty,
  MusicSingerRelationProperty,
  SINGER_TABLE_NAME,
  Singer,
  SingerProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getSingerListInMusicIds } from '@/db/singer';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 100;
type LocalMusic = Pick<
  Music,
  MusicProperty.ID | MusicProperty.NAME | MusicProperty.ALIASES
>;
type LocalMusicPlayRecord = LocalMusic & {
  recordId: number;
  percent: number;
  timestamp: number;
};

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
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  let total: number;
  let musicPlayRecordList: LocalMusicPlayRecord[];
  if (keyword.length) {
    const pattern = `%${keyword}%`;
    const musicPatternSQL = `
      SELECT
        ${MusicProperty.ID}
      FROM ${MUSIC_TABLE_NAME}
      WHERE ${MusicProperty.NAME} LIKE ?
        OR ${MusicProperty.ALIASES} LIKE ?
    `;
    const singerPatternSQL = `
      SELECT
        msr.${MusicSingerRelationProperty.MUSIC_ID}
      FROM ${MUSIC_SINGER_RELATION_TABLE_NAME} AS msr
      LEFT JOIN ${SINGER_TABLE_NAME} as s
        ON msr.${MusicSingerRelationProperty.SINGER_ID} = s.${SingerProperty.ID}
      LEFT JOIN ${MUSIC_TABLE_NAME} as m
        ON msr.${MusicSingerRelationProperty.MUSIC_ID} = m.${MusicProperty.ID}
      WHERE s.${SingerProperty.NAME} LIKE ?
        OR s.${SingerProperty.ALIASES} LIKE ?
    `;
    const [totalObject, localMusicPlayRecordList] = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT
            count(*) AS value
          FROM ${MUSIC_PLAY_RECORD_TABLE_NAME} AS mpr
          LEFT JOIN ${MUSIC_TABLE_NAME} AS m
            ON mpr.${MusicPlayRecordProperty.MUSIC_ID} = m.${MusicProperty.ID}
          WHERE mpr.${MusicPlayRecordProperty.USER_ID} = ?
            AND (
              m.${MusicProperty.ID} IN (${musicPatternSQL})
              OR m.${MusicProperty.ID} IN (${singerPatternSQL})
            )
        `,
        [ctx.user.id, pattern, pattern, pattern, pattern],
      ),
      getDB().all<LocalMusicPlayRecord>(
        `
          SELECT
            mpr.${MusicPlayRecordProperty.ID} as recordId,
            mpr.${MusicPlayRecordProperty.PERCENT},
            mpr.${MusicPlayRecordProperty.TIMESTAMP},
            
            m.${MusicProperty.ID},
            m.${MusicProperty.NAME},
            m.${MusicProperty.ALIASES}
          FROM ${MUSIC_PLAY_RECORD_TABLE_NAME} AS mpr
          LEFT JOIN ${MUSIC_TABLE_NAME} AS m
            ON mpr.${MusicPlayRecordProperty.MUSIC_ID} = m.${MusicProperty.ID}
          WHERE mpr.${MusicPlayRecordProperty.USER_ID} = ?
            AND (
              m.${MusicProperty.ID} IN (${musicPatternSQL})
              OR m.${MusicProperty.ID} IN (${singerPatternSQL})
            )
          ORDER BY mpr.${MusicPlayRecordProperty.TIMESTAMP} DESC
          LIMIT ?
          OFFSET ?
        `,
        [
          ctx.user.id,
          pattern,
          pattern,
          pattern,
          pattern,
          pageSizeNumber,
          (pageNumber - 1) * pageSizeNumber,
        ],
      ),
    ]);
    total = totalObject!.value;
    musicPlayRecordList = localMusicPlayRecordList;
  } else {
    const [totolObject, localMusicPlayRecordList] = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT
            count(*) AS value
          FROM ${MUSIC_PLAY_RECORD_TABLE_NAME}
          WHERE ${MusicPlayRecordProperty.USER_ID} = ?
        `,
        [ctx.user.id],
      ),
      getDB().all<LocalMusicPlayRecord>(
        `
          SELECT
            mpr.${MusicPlayRecordProperty.ID} as recordId,
            mpr.${MusicPlayRecordProperty.PERCENT},
            mpr.${MusicPlayRecordProperty.TIMESTAMP},
            
            m.${MusicProperty.ID},
            m.${MusicProperty.NAME},
            m.${MusicProperty.ALIASES}
          FROM ${MUSIC_PLAY_RECORD_TABLE_NAME} AS mpr
          LEFT JOIN ${MUSIC_TABLE_NAME} AS m
            ON mpr.${MusicPlayRecordProperty.MUSIC_ID} = m.${MusicProperty.ID}
          WHERE mpr.${MusicPlayRecordProperty.USER_ID} = ?
          ORDER BY mpr.${MusicPlayRecordProperty.TIMESTAMP} DESC
          LIMIT ?
          OFFSET ?
        `,
        [ctx.user.id, pageSizeNumber, (pageNumber - 1) * pageSizeNumber],
      ),
    ]);
    total = totolObject!.value;
    musicPlayRecordList = localMusicPlayRecordList;
  }

  if (!musicPlayRecordList.length) {
    return ctx.success({
      total,
      musicPlayRecordList: [],
    });
  }

  const singerList = await getSingerListInMusicIds(
    musicPlayRecordList.map((m) => m.id),
    [SingerProperty.ID, SingerProperty.NAME],
  );
  const musicIdMapSingerList: {
    [key: string]: Pick<Singer, SingerProperty.ID | SingerProperty.NAME>[];
  } = {};
  singerList.forEach((s) => {
    if (!musicIdMapSingerList[s.musicId]) {
      musicIdMapSingerList[s.musicId] = [];
    }
    musicIdMapSingerList[s.musicId].push(excludeProperty(s, ['musicId']));
  });

  return ctx.success({
    total,
    musicPlayRecordList: musicPlayRecordList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingerList[m.id] || [],
    })),
  });
};
