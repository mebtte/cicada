import Cache from '@/utils/cache';
import { Tab } from './constants';

export enum CacheKey {
  SELECTED_TAB = 'selected_tab',
}

export default new Cache<
  CacheKey,
  {
    [CacheKey.SELECTED_TAB]: Tab;
  }
>();
