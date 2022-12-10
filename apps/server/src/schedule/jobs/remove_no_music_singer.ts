import fs from 'fs/promises';
import withTimeout from '#/utils/with_timeout';
import { getDB } from '@/db';
import { Singer, Property } from '@/db/singer';
import day from '#/utils/day';
import { NO_MUSIC_EXIST_DURATION } from '#/constants/singer';
import { getTrashDirectory } from '@/config';

async function removeNoMusicSinger() {
  const noMusicSingerList = await getDB().all<Singer>(
    `
      SELECT
        ${Object.values(Property).join(', ')}
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
      getDB().run(
        `
          DELETE FROM singer_modify_record
          WHERE singerId in ( ${noMusicSingerList.map(() => '?').join(', ')} )
        `,
        noMusicSingerList.map((s) => s.id),
      ),
      fs.writeFile(
        `${getTrashDirectory()}/deleted_singer_${day().format(
          'YYYYMMDDHHmmss',
        )}.json`,
        JSON.stringify(noMusicSingerList),
      ),
    ]);
    await getDB().run(
      `
        DELETE FROM singer
        WHERE id IN ( ${noMusicSingerList.map(() => '?').join(',')} )
      `,
      noMusicSingerList.map((s) => s.id),
    );
  }
}

export default withTimeout(removeNoMusicSinger, 1000 * 60);
