import * as db from '@/platform/db';

const TTL = 1000 * 60 * 60 * 24 * 30;

function removeOutdatedLoginCode() {
  return db.run('delete from login_code where createTimestamp <= ?', [
    Date.now() - TTL,
  ]);
}

export default removeOutdatedLoginCode;
