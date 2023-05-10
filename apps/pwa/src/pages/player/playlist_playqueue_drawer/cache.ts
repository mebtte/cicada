import Cache from '#/utils/cache';
import { Tab } from './constants';

export enum CacheKey {
  TAB = 'tab',
}

export default new Cache<
  CacheKey,
  {
    [CacheKey.TAB]: Tab;
  }
>();
