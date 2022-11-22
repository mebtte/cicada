import db from '@/db';
import withTimeout from '#/utils/with_timeout';
import sleep from '#/utils/sleep';

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
];

async function removeOutdatedDB() {
  for (const { table, timestampColumn, ttl } of TABLES) {
    await Promise.all([
      db.run(
        `
        DELETE FROM ${table}
        WHERE ${timestampColumn} <= ?
      `,
        [Date.now() - ttl],
      ),
      sleep(1000),
    ]);
  }
}

export default withTimeout(removeOutdatedDB, 60 * 1000);
