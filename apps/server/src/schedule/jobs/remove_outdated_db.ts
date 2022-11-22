import db from '@/db';
import withTimeout from '#/utils/with_timeout';
import fs from 'fs/promises';
import { TRASH_DIR } from '@/constants/directory';
import day from '#/utils/day';

const TABLES: {
  table: string;
  timestampColumn: string;
  ttl: number;
}[] = [
  {
    table: 'captcha',
    timestampColumn: 'createTimestamp',
    ttl: 1000 * 60 * 60 * 24 * 3,
  },
  {
    table: 'login_code',
    timestampColumn: 'createTimestamp',
    ttl: 1000 * 60 * 60 * 24 * 7,
  },
  {
    table: 'musicbill_export',
    timestampColumn: 'createTimestmap',
    ttl: 1000 * 60 * 60 * 24 * 30,
  },
  {
    table: 'music_modify_record',
    timestampColumn: 'modifyTimestamp',
    ttl: 1000 * 60 * 60 * 24 * 180,
  },
  {
    table: 'singer_modify_record',
    timestampColumn: 'modifyTimestamp',
    ttl: 1000 * 60 * 60 * 24 * 180,
  },
];

async function removeOutdatedDB() {
  const now = Date.now();
  for (const { table, timestampColumn, ttl } of TABLES) {
    const rows = await db.all(
      `
        SELECT
          *
        FROM ${table}
        WHERE ${timestampColumn} <= ?
      `,
      [now - ttl],
    );
    if (rows.length) {
      await Promise.all([
        fs.writeFile(
          `${TRASH_DIR}/outdated_table_${table}_${day(now).format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(rows),
        ),
        db.run(
          `
          DELETE FROM ${table}
          WHERE ${timestampColumn} <= ?
        `,
          [now - ttl],
        ),
      ]);
    }
  }
}

export default withTimeout(removeOutdatedDB, 60 * 1000);
