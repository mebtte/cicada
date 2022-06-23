import os from 'os';
import fs from 'fs';
import path from 'path';
import * as yargs from 'yargs';

const ARGV_FILE = path.join(__dirname, '../../../argv.json');
let fromFile: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
} = {};
if (fs.existsSync(ARGV_FILE)) {
  fromFile = JSON.parse(fs.readFileSync(ARGV_FILE).toString());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const argv = yargs.parse(process.argv) as any;
const port = Number(argv.port || fromFile.port) || 8000;
const result = {
  /** default */
  base: path.join(__dirname, '../../../resources'),
  publicAddress: `http://localhost:${port}`,

  ...fromFile,
  ...argv,

  port,
  emailPort: Number(argv.emailPort || fromFile.emailPort) || 465,
  clusterCount:
    Number(argv.clusterCount || fromFile.clusterCount) || os.cpus().length,
  userExportMusicbillMaxTimesPerDay:
    Number(
      argv.userExportMusicbillMaxTimesPerDay ||
        fromFile.userExportMusicbillMaxTimesPerDay,
    ) || 3,
  userUploadMusicMaxTimesPerDay:
    Number(
      argv.userUploadMusicMaxTimesPerDay ||
        fromFile.userUploadMusicMaxTimesPerDay,
    ) || 5,
} as {
  base: string;
  publicAddress: string;
  clusterCount: number;
  emailPort: number;
  emailHost: string;
  emailUser: string;
  emailPass: string;
  port: number;
  userExportMusicbillMaxTimesPerDay: number;
  userUploadMusicMaxTimesPerDay: number;
};

if (!result.emailHost || !result.emailUser || !result.emailPass) {
  throw new Error(
    '请通过 [--emailHost] [--emailUser] [--emailPass] 指定发信邮箱',
  );
}

export default result;
