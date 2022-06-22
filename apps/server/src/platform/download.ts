import argv from '@/argv';
import { DOWNLOAD_DIR } from '@/constants/directory';
import { DownloadType, DOWNLOAD_PREFIX } from '../constants';

export function getDownloadPath(resource: string, downloadType: DownloadType) {
  return `${DOWNLOAD_DIR[downloadType]}/${resource}`;
}

export function getDownloadUrl(resource: string, downloadType: DownloadType) {
  return `${argv.publicAddress}/${DOWNLOAD_PREFIX}/${downloadType}/${resource}`;
}
