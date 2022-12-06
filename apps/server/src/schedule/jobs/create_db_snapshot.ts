import zlib from 'zlib';
import fs from 'fs';
import util from 'util';
import stream from 'stream';
import { DB_SNAPSHOT_DIR } from '@/constants/directory';
import day from '#/utils/day';
import withTimeout from '#/utils/with_timeout';
import config from '@/config';

const pipelineAsync = util.promisify(stream.pipeline);

async function createDBSnapshot() {
  const dateString = day().format('YYYYMMDD');
  const gzip = zlib.createGzip();
  await pipelineAsync(
    fs.createReadStream(`${config.get().base}/db`),
    gzip,
    fs.createWriteStream(`${DB_SNAPSHOT_DIR}/db_${dateString}.gz`),
  );
}

export default withTimeout(createDBSnapshot, 60 * 1000);
