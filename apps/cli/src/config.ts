import { AssetType } from '#/constants';

export enum Mode {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

export interface Config {
  mode: Mode;

  data: string;
  port: number;
}

export const DEFAULT_CONFIG: Config = {
  mode: Mode.PRODUCTION,

  data: `${process.cwd()}/cicada`,
  port: 8000,
};

let config: Config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

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

export function updateConfig(partial: Partial<Config>) {
  config = {
    ...config,
    ...partial,
  };
}
