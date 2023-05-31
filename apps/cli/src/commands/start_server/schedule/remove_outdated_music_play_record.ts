import withTimeout from '#/utils/with_timeout';
import {
  MUSIC_PLAY_RECORD_TABLE_NAME,
  MusicPlayRecord,
  MusicPlayRecordProperty,
  USER_TABLE_NAME,
  User,
  UserProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import logger from '@/utils/logger';

async function removeOutdatedMusicPlayRecord() {
  const userList = await getDB().all<
    Pick<User, UserProperty.ID | UserProperty.MUSIC_PLAY_RECORD_INDATE>
  >(
    `
      SELECT
        ${UserProperty.ID},
        ${UserProperty.MUSIC_PLAY_RECORD_INDATE}
      FROM ${USER_TABLE_NAME}
      WHERE ${UserProperty.MUSIC_PLAY_RECORD_INDATE} != 0
    `,
    [],
  );
  if (!userList.length) {
    return;
  }

  const now = Date.now();
  for (const user of userList) {
    const musicPlayRecordList = await getDB().all<MusicPlayRecord>(
      `
        SELECT
          *
        FROM ${MUSIC_PLAY_RECORD_TABLE_NAME}
        WHERE ${MusicPlayRecordProperty.USER_ID} = ?
          AND ${MusicPlayRecordProperty.TIMESTAMP} <= ?
      `,
      [user.id, now - user.musicPlayRecordIndate * 1000 * 60 * 60 * 24],
    );
    if (musicPlayRecordList.length) {
      await getDB().run(
        `
          DELETE FROM ${MUSIC_PLAY_RECORD_TABLE_NAME}
          WHERE ${MusicPlayRecordProperty.ID} IN ( ${musicPlayRecordList
          .map(() => '?')
          .join(',')} )
        `,
        musicPlayRecordList.map((mpr) => mpr.id),
      );
      logger.info({
        label: 'remove_outdated_music_play_record',
        title: user.id,
        message: JSON.stringify(musicPlayRecordList),
      });
    }
  }
}

export default withTimeout(removeOutdatedMusicPlayRecord, 60 * 1000);
