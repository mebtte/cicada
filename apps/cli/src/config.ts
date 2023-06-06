import { AssetType } from '#/constants';
import fs from 'fs';
import Joi from 'joi';
import json5 from 'json5';
import exitWithMessage from './utils/exit_with_message';

export interface Config {
  mode: 'development' | 'production';
  firstUserEmail: string;

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
  firstUserEmail: Joi.string().email().allow(''),

  data: Joi.string().optional(),
  port: Joi.number().port().optional(),

  emailHost: Joi.string().hostname().required(),
  emailPort: Joi.number().port().optional(),
  emailUser: Joi.string().required(),
  emailPass: Joi.string().required(),
});
let config: Config = {
  mode: 'production',
  firstUserEmail: '',

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

export function getCacheDirectory() {
  return `${config.data}/cache`;
}

export function getAssetDirectory(assetType?: AssetType) {
  if (assetType) {
    return `${config.data}/assets/${assetType}`;
  }
  return `${config.data}/assets`;
}

export function updateConfigFromFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return exitWithMessage(`Config file [ ${filePath} ] not exist`);
  }

  let configFromFile: Partial<Config> = {};
  try {
    const dataString = fs.readFileSync(filePath).toString();
    configFromFile = json5.parse(dataString);
  } catch (error) {
    console.error(error);
    return exitWithMessage(`Can not parse config file [ ${filePath} ]`);
  }

  config = {
    ...config,
    ...configFromFile,
  };

  const { error } = schema.validate(config);
  if (error) {
    console.error(error);
    return exitWithMessage(`Can not validate config file [ ${filePath} ]`);
  }
}

export function updateConfig(partial: Partial<Config>) {
  config = {
    ...config,
    ...partial,
  };
}
