import db from '@/platform/db';

const TTL = 1000 * 60 * 60 * 24 * 30;

function removeOutdatedCaptcha() {
  return new Promise<void>((resolve, reject) =>
    db.run(
      'delete from captcha where createTimestamp <= ?',
      [Date.now() - TTL],
      (_, error) => (error ? reject(error) : resolve()),
    ),
  );
}

export default removeOutdatedCaptcha;
