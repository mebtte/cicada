import * as db from '@/db';

const TTL = 1000 * 60 * 60 * 24 * 7;

function removeOutdatedLoginCode() {
  return db.run('delete from login_code where createTimestamp <= ?', [
    Date.now() - TTL,
  ]);
}

export default removeOutdatedLoginCode;
