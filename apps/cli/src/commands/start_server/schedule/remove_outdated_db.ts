import { getDB } from '@/db';
import withTimeout from '#/utils/with_timeout';
import {
  CAPTCHA_TABLE_NAME,
  CaptchaProperty,
  MUSIC_MODIFY_RECORD_TABLE_NAME,
  MusicModifyRecordProperty,
  SINGER_MODIFY_RECORD_TABLE_NAME,
  SingerModifyRecordProperty,
} from '@/constants/db_definition';
import { SINGER_MODIFY_RECORD_TTL } from '#/constants';

const TABLES: {
  table: string;
  timestampColumn: string;
  ttl: number;
}[] = [
  {
    table: CAPTCHA_TABLE_NAME,
    timestampColumn: CaptchaProperty.CREATE_TIMESTAMP,
    ttl: 1000 * 60 * 60 * 24 * 3,
  },
  {
    table: MUSIC_MODIFY_RECORD_TABLE_NAME,
    timestampColumn: MusicModifyRecordProperty.MODIFY_TIMESTAMP,
    ttl: 1000 * 60 * 60 * 24 * 180,
  },
  {
    table: SINGER_MODIFY_RECORD_TABLE_NAME,
    timestampColumn: SingerModifyRecordProperty.MODIFY_TIMESTAMP,
    ttl: SINGER_MODIFY_RECORD_TTL,
  },
];

async function removeOutdatedDB() {
  const now = Date.now();
  for (const { table, timestampColumn, ttl } of TABLES) {
    await getDB().run(
      `
        DELETE FROM ${table}
        WHERE ${timestampColumn} <= ?
      `,
      [now - ttl],
    );
  }
}

export default withTimeout(removeOutdatedDB, 60 * 1000);
