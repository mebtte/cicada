import { AssetType } from '#/constants';
import config from '@/config';

export const ROOT_ASSET_DIR = `${config.get().base}/assets`;
export const ASSET_DIR: Record<AssetType, string> = {
  [AssetType.USER_AVATAR]: `${ROOT_ASSET_DIR}/${AssetType.USER_AVATAR}`,
  [AssetType.SINGER_AVATAR]: `${ROOT_ASSET_DIR}/${AssetType.SINGER_AVATAR}`,
  [AssetType.MUSIC_COVER]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_COVER}`,
  [AssetType.MUSIC_SQ]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_SQ}`,
  [AssetType.MUSIC_HQ]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_HQ}`,
  [AssetType.MUSIC_AC]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_AC}`,
  [AssetType.MUSICBILL_COVER]: `${ROOT_ASSET_DIR}/${AssetType.MUSICBILL_COVER}`,
};

export const DB_SNAPSHOT_DIR = `${config.get().base}/db_snapshots`;

export const TRASH_DIR = `${config.get().base}/trash`;

export const LOG_DIR = `${config.get().base}/logs`;

export const DOWNLOAD_DIR = `${config.get().base}/downloads`;
