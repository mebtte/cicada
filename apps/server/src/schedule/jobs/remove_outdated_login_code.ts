import * as db from '@/db';
import withTimeout from '#/utils/with_timeout';

const TTL = 1000 * 60 * 60 * 24 * 7;

function removeOutdatedLoginCode() {
  return db.run('delete from login_code where createTimestamp <= ?', [
    Date.now() - TTL,
  ]);
}

export default withTimeout(removeOutdatedLoginCode, 60 * 1000);
