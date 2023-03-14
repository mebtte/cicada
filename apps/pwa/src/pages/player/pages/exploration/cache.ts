import Cache from '#/utils/cache';
import { Exploration } from './constants';

export enum CacheKey {
  EXPLORATION = 'exploration',
}

const cache = new Cache<
  CacheKey,
  {
    [CacheKey.EXPLORATION]: Exploration;
  }
>();

export default cache;
