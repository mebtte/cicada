import { AssetType } from '#/constants';
import fs from 'fs';
import Joi from 'joi';
import json5 from 'json5';
import exitWithMessage from './utils/exit_with_message';

export interface Config {
  mode: 'development' | 'production';
  initialAdminEmail: string;

  data: string;
  port: number;

  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPass: string;
}

const schema = Joi.object<Config>({
  mode: Joi.string()
    .pattern(/development|production/)
    .optional(),
  initialAdminEmail: Joi.string().email().allow(''),

  data: Joi.string().optional(),
  port: Joi.number().port().optional(),

  emailHost: Joi.string().hostname().required(),
  emailPort: Joi.number().port().optional(),
  emailUser: Joi.string().required(),
  emailPass: Joi.string().required(),
});
let config: Config = {
  mode: 'production',
  initialAdminEmail: '',

  data: `${process.cwd()}/cicada`,
  port: 8000,

  emailHost: '',
  emailPort: 465,
  emailUser: '',
  emailPass: '',
};

export function getConfig() {
  return config;
}

export function getDataVersionPath() {
  return `${config.data}/v`;
}

export function getDBFilePath() {
  return `${config.data}/db`;
}

export function getJWTSecretFilePath() {
  return `${config.data}/jwt_secret`;
}

export function getLoginCodeSaltFilePath() {
  return `${config.data}/login_code_salt`;
}

export function getDBSnapshotDirectory() {
  return `${config.data}/db_snapshots`;
}

export function getTrashDirectory() {
  return `${config.data}/trash`;
}

export function getLogDirectory() {
  return `${config.data}/logs`;
}

export function getDownloadDirectory() {
  return `${config.data}/downloads`;
}

export function getAssetDirectory(assetType?: AssetType) {
  if (assetType) {
    return `${config.data}/assets/${assetType}`;
  }
  return `${config.data}/assets`;
}

export function updateConfigFromFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    /**
     * 兼容旧版本中 docker 配置文件位于 /config.json
     * v1 版本可移除此兼容
     * @author mebtte<hi@mebtte.com>
     */
    if (!fs.existsSync('/config.json')) {
      return exitWithMessage(`配置文件「${filePath}」不存在`);
    }
    // eslint-disable-next-line no-param-reassign
    filePath = '/config.json';
  }

  let configFromFile: Partial<Config> = {};
  try {
    const dataString = fs.readFileSync(filePath).toString();
    configFromFile = json5.parse(dataString);
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

export function updateConfig(partial: Partial<Config>) {
  config = {
    ...config,
    ...partial,
  };
}
