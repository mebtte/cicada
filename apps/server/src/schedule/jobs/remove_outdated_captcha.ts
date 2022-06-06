import * as db from '@/db';

const TTL = 1000 * 60 * 60 * 24 * 3;

function removeOutdatedCaptcha() {
  return db.run('delete from captcha where createTimestamp <= ?', [
    Date.now() - TTL,
  ]);
}

export default removeOutdatedCaptcha;
