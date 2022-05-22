import os from 'os';
import fs from 'fs';
import path from 'path';
import * as yargs from 'yargs';
import env from './env';

const DEVELOPMENT_CONFIG_FILE = path.join(__dirname, '../../../config.json');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const argv = yargs.parse(process.argv) as any;
const base: string = argv.base || `${os.homedir()}/.cicada`;
const port: number = argv.port || 8000;
const publicAddress: string = argv.publicAddress || `http://localhost:${port}`;
const clusterCount: number = argv.clusterCount || os.cpus().length;

const {
  emailHost,
  emailPort,
  emailUser,
  emailPass,
}: {
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPass: string;
} = argv;

// eslint-disable-next-line import/no-mutable-exports
let result = {
  emailHost,
  emailPort,
  emailUser,
  emailPass,

  base,
  port,
  publicAddress,
  clusterCount,
};

if (env.RUNENV === 'development' && fs.existsSync(DEVELOPMENT_CONFIG_FILE)) {
  const developmentConfig = JSON.parse(
    fs.readFileSync(DEVELOPMENT_CONFIG_FILE).toString(),
  );
  result = {
    ...result,
    ...developmentConfig,
  };
}

if (
  !result.emailHost ||
  !result.emailPort ||
  !result.emailUser ||
  !result.emailPass
) {
  throw new Error(
    '请通过 [--emailHost] [--emailPort] [--emailUser] [--emailPass] 指定发信邮箱',
  );
}

export default result;
