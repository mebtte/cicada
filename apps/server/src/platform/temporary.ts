import argv from '@/argv';
import { TEMPORARY_DIR } from '@/constants/directory';
import { TEMPORARY_PREFIX } from '#/constants';
import { TemporaryType } from '../constants';

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
