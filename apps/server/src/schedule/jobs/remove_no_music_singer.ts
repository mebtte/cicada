import fs from 'fs/promises';
import withTimeout from '#/utils/with_timeout';
import db from '@/db';
import { Singer, Property } from '@/db/singer';
import { TRASH_DIR } from '@/constants/directory';
import day from '#/utils/day';
import { NO_MUSIC_EXIST_DURATION } from '#/constants/singer';

async function removeNoMusicSinger() {
  const noMusicSingerList = await db.all<Singer>(
    `
      SELECT
        ${Object.values(Property).join(',')}
      FROM
        singer
      WHERE
        id NOT IN (
          SELECT
            singerId
          FROM
            music_singer_relation
        )
        AND createTimestamp < ?
    `,
    [Date.now() - NO_MUSIC_EXIST_DURATION],
  );
  if (noMusicSingerList.length) {
    await Promise.all([
      db.run(
        `
          DELETE FROM singer_modify_record
            WHERE singerId in ( ${noMusicSingerList.map(() => '?').join(',')} )
        `,
        noMusicSingerList.map((s) => s.id),
      ),
      fs.writeFile(
        `${TRASH_DIR}/deleted_singer_${day().format('YYYYMMDDHHmmss')}.json`,
        JSON.stringify(noMusicSingerList),
      ),
    ]);
    await db.run(
      `
        DELETE FROM singer
        WHERE id in ( ${noMusicSingerList.map(() => '?').join(',')} )
      `,
      noMusicSingerList.map((s) => s.id),
    );
  }
}

export default withTimeout(removeNoMusicSinger, 1000 * 60);
