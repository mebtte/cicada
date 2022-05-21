import zlib from 'zlib';
import fs from 'fs';
import util from 'util';
import stream from 'stream';
import { DB_SNAPSHOT_DIR } from '@/constants/directory';
import day from '#/utils/day';
import { DB_FILE_PATH } from '../../constants';

const TTL = 1000 * 60 * 60 * 24 * 90;
const readdirAsync = util.promisify(fs.readdir);
const rmAsync = util.promisify(fs.rm);
const statAsync = util.promisify(fs.stat);
const pipelineAsync = util.promisify(stream.pipeline);

async function removeOutdatedDBSnapshot() {
  const files = await readdirAsync(DB_SNAPSHOT_DIR);
  for (const file of files) {
    const absolutePath = `${DB_SNAPSHOT_DIR}/${file}`;
    const stat = await statAsync(absolutePath);
    if (stat.isDirectory() || Date.now() - stat.birthtimeMs >= TTL) {
      await rmAsync(absolutePath, {
        recursive: true,
        force: true,
      });
    }
  }
}

async function createDBSnapshot() {
  const dateString = day().format('YYYYMMDD');
  const gzip = zlib.createGzip();
  await pipelineAsync(
    fs.createReadStream(DB_FILE_PATH),
    gzip,
    fs.createWriteStream(`${DB_SNAPSHOT_DIR}/${dateString}.gz`),
  );
}

async function createAndRemoveOutdatedDBSnapshot() {
  await removeOutdatedDBSnapshot();
  await createDBSnapshot();
}

export default createAndRemoveOutdatedDBSnapshot;
