import zlib from 'zlib';
import fs from 'fs';
import util from 'util';
import stream from 'stream';
import day from '#/utils/day';
import withTimeout from '#/utils/with_timeout';
import { getDBFilePath, getDBSnapshotDirectory } from '@/config';

const pipelineAsync = util.promisify(stream.pipeline);

async function createDBSnapshot() {
  const dateString = day().format('YYYYMMDD');
  const gzip = zlib.createGzip();
  await pipelineAsync(
    fs.createReadStream(getDBFilePath()),
    gzip,
    fs.createWriteStream(`${getDBSnapshotDirectory()}/db_${dateString}.gz`),
  );
}

export default withTimeout(createDBSnapshot, 60 * 1000);
