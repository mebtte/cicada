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
const port: number = argv.port || fromFile.port || 8000;
const result = {
  /** default */
  base: `${os.homedir()}/.cicada`,
  publicAddress: `http://localhost:${port}`,
  clusterCount: os.cpus().length,
  emailPort: 465,

  ...fromFile,
  ...argv,

  port,
} as {
  base: string;
  publicAddress: string;
  clusterCount: number;
  emailPort: number;
  emailHost: string;
  emailUser: string;
  emailPass: string;
  port: number;
};

if (!result.emailHost || !result.emailUser || !result.emailPass) {
  throw new Error(
    '请通过 [--emailHost] [--emailUser] [--emailPass] 指定发信邮箱',
  );
}

export default result;
