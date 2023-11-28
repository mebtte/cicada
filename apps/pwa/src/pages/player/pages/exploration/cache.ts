import Cache from '@/utils/cache';
import { ExplorationItem } from './constants';

export enum CacheKey {
  EXPLORATION = 'exploration',
}

const cache = new Cache<
  CacheKey,
  {
    [CacheKey.EXPLORATION]: ExplorationItem[];
  }
>();

export default cache;
