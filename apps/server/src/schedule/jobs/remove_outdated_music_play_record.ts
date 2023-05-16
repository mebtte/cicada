import withTimeout from '#/utils/with_timeout';
import { getDB } from '@/db';

async function removeOutdatedMusicPlayRecord() {
  const userList = await getDB().all(
    `
  
    `,
    [],
  );
}

export default withTimeout(removeOutdatedMusicPlayRecord, 60 * 1000);
