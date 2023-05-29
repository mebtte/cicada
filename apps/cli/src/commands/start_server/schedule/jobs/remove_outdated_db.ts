import { getDB } from '@/db';
import withTimeout from '#/utils/with_timeout';
import {
  CAPTCHA_TABLE_NAME,
  CaptchaProperty,
  LOGIN_CODE_TABLE_NAME,
  LoginCodeProperty,
  MUSICBILL_EXPORT_TABLE_NAME,
  MUSIC_MODIFY_RECORD_TABLE_NAME,
  MusicModifyRecordProperty,
  MusicbillExportProperty,
  SINGER_MODIFY_RECORD_TABLE_NAME,
  SingerModifyRecordProperty,
} from '@/constants/db_definition';

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
    table: LOGIN_CODE_TABLE_NAME,
    timestampColumn: LoginCodeProperty.CREATE_TIMESTAMP,
    ttl: 1000 * 60 * 60 * 24 * 7,
  },
  {
    table: MUSICBILL_EXPORT_TABLE_NAME,
    timestampColumn: MusicbillExportProperty.CREATE_TIMESTAMP,
    ttl: 1000 * 60 * 60 * 24 * 30,
  },
  {
    table: MUSIC_MODIFY_RECORD_TABLE_NAME,
    timestampColumn: MusicModifyRecordProperty.MODIFY_TIMESTAMP,
    ttl: 1000 * 60 * 60 * 24 * 180,
  },
  {
    table: SINGER_MODIFY_RECORD_TABLE_NAME,
    timestampColumn: SingerModifyRecordProperty.MODIFY_TIMESTAMP,
    ttl: 1000 * 60 * 60 * 24 * 180,
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
