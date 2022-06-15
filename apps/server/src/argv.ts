import os from 'os';
import fs from 'fs';
import path from 'path';
import * as yargs from 'yargs';
import env from './env';

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
  base: path.join(__dirname, '../../../resources'),
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

/** 环境变量覆盖 */
type ENV_PROPERTIES = Extract<
  keyof typeof env,
  | 'PORT'
  | 'PUBLIC_ADDRESS'
  | 'CLUSTER_COUNT'
  | 'EMAIL_HOST'
  | 'EMAIL_PORT'
  | 'EMAIL_USER'
  | 'EMAIL_PASS'
>;
const ENV_KEY_MAP: {
  [key in ENV_PROPERTIES]: keyof typeof result;
} = {
  PORT: 'port',
  PUBLIC_ADDRESS: 'publicAddress',
  CLUSTER_COUNT: 'clusterCount',
  EMAIL_HOST: 'emailHost',
  EMAIL_PORT: 'emailPort',
  EMAIL_USER: 'emailUser',
  EMAIL_PASS: 'emailPass',
};
Object.keys(ENV_KEY_MAP).forEach((key) => {
  if (env[key]) {
    result[ENV_KEY_MAP[key]] = env[key];
  }
});

if (!result.emailHost || !result.emailUser || !result.emailPass) {
  throw new Error(
    '请通过 [--emailHost] [--emailUser] [--emailPass] 指定发信邮箱',
  );
}

export default result;
