import { getDB } from '@/db';
import withTimeout from '#/utils/with_timeout';
import {
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbillProperty,
} from '@/constants/db_definition';
import { SHARED_MUSICBILL_INVITATION_TTL } from '#/constants';

async function removeOutdatedSharedMusicbillInvitation() {
  await getDB().run(
    `
        DELETE FROM ${SHARED_MUSICBILL_TABLE_NAME}
        WHERE ${SharedMusicbillProperty.SHARE_TIMESTAMP} <= ?
          AND ${SharedMusicbillProperty.ACCEPTED} = 0
      `,
    [Date.now() - SHARED_MUSICBILL_INVITATION_TTL],
  );
}

export default withTimeout(removeOutdatedSharedMusicbillInvitation, 60 * 1000);
