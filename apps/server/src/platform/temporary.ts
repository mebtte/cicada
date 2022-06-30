import argv from '@/argv';
import { TEMPORARY_DIR } from '@/constants/directory';
import { TemporaryType, TEMPORARY_PREFIX } from '../constants';

export function getTemporaryPath(
  resource: string,
  temporaryType: TemporaryType,
) {
  return `${TEMPORARY_DIR[temporaryType]}/${resource}`;
}

export function getTemporaryUrl(
  resource: string,
  temporaryType: TemporaryType,
) {
  return `${argv.publicAddress}/${TEMPORARY_PREFIX}/${temporaryType}/${resource}`;
}
