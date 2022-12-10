import { AssetType } from '#/constants';
import fs from 'fs';
import Joi from 'joi';
import exitWithMessage from './utils/exit_with_message';

export interface Config {
  mode: 'development' | 'production';

  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPass: string;

  base: string;
  port: number;
  userMusicbillMaxAmount: number;
  userExportMusicbillMaxTimesPerDay: number;
  userCreateMusicMaxTimesPerDay: number;
  publicOrigin: string;
  initialAdminEmail: string;
}

const schema = Joi.object<Config>({
  mode: Joi.string()
    .pattern(/development|production/)
    .optional(),

  emailHost: Joi.string().hostname().required(),
  emailPort: Joi.number().port().optional(),
  emailUser: Joi.string().required(),
  emailPass: Joi.string().required(),

  base: Joi.string().optional(),
  port: Joi.number().port().optional(),
  userMusicbillMaxAmount: Joi.number().greater(0).optional(),
  userExportMusicbillMaxTimesPerDay: Joi.number().greater(0).optional(),
  userCreateMusicMaxTimesPerDay: Joi.number().greater(0).optional(),
  publicOrigin: Joi.string().optional(),
  initialAdminEmail: Joi.string().email().allow(''),
});
let config: Config = {
  mode: 'production',

  emailHost: '',
  emailPort: 465,
  emailUser: '',
  emailPass: '',

  base: `${process.cwd()}/cicada`,
  port: 8000,
  userMusicbillMaxAmount: 100,
  userExportMusicbillMaxTimesPerDay: 3,
  userCreateMusicMaxTimesPerDay: 5,
  publicOrigin: '',
  initialAdminEmail: '',
};

export function getConfig() {
  return config;
}

export function getDBFilePath() {
  return `${config.base}/db`;
}

export function getJWTSecretFilePath() {
  return `${config.base}/jwt_secret`;
}

export function getLoginCodeSaltFilePath() {
  return `${config.base}/login_code_salt`;
}

export function getDBSnapshotDirectory() {
  return `${config.base}/db_snapshots`;
}

export function getTrashDirectory() {
  return `${config.base}/trash`;
}

export function getLogDirectory() {
  return `${config.base}/logs`;
}

export function getDownloadDirectory() {
  return `${config.base}/downloads`;
}

export function getAssetDirectory(assetType?: AssetType) {
  if (assetType) {
    return `${config.base}/assets/${assetType}`;
  }
  return `${config.base}/assets`;
}

export function updateConfigFromFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return exitWithMessage(`配置文件「${filePath}」不存在`);
  }

  let configFromFile: Partial<Config> = {};
  try {
    const dataString = fs.readFileSync(filePath).toString();
    configFromFile = JSON.parse(dataString);
  } catch (error) {
    console.error(error);
    exitWithMessage(`解析配置文件「${filePath}」失败`);
  }

  config = {
    ...config,
    ...configFromFile,
  };

  const { error } = schema.validate(config);
  if (error) {
    console.error(error);
    exitWithMessage(`配置文件「${filePath}」错误`);
  }
}
