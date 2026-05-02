import Cache from '@/utils/cache';
import { ExplorationData } from './constants';

export enum CacheKey {
  EXPLORATION = 'exploration',
}

const cache = new Cache<
  CacheKey,
  {
    [CacheKey.EXPLORATION]: ExplorationData;
  }
>();

export default cache;
