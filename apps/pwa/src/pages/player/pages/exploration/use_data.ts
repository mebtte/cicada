import logger from '@/utils/logger';
import getExploration from '@/server/api/get_exploration';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelectedServer, useUser } from '@/global_states/server';
import { ExplorationData } from './constants';
import cache, { CacheKey } from './cache';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

type Data =
  | {
      error: Error;
      loading: false;
      value: ExplorationData;
    }
  | {
      error: null;
      loading: true;
      value: ExplorationData;
    }
  | {
      error: null;
      loading: false;
      value: ExplorationData;
    };
const dataLoading: Data = {
  error: null,
  loading: true,
  value: {
    musicList: [],
    singerList: [],
    publicMusicbillList: [],
  },
};
const EXPLORATION_CACHE_TTL = 1000 * 60 * 5;

let lastActiveCacheScope: string | null = null;

export default () => {
  const selectedServer = useSelectedServer();
  const user = useUser();
  const selectedServerOrigin = selectedServer?.origin;
  const userId = user?.id;
  const [data, setData] = useState<Data>(dataLoading);
  const requestIdRef = useRef(0);
  const cacheScope = useMemo(() => {
    if (!selectedServerOrigin || !userId) {
      return null;
    }

    return `${selectedServerOrigin}:${userId}`;
  }, [selectedServerOrigin, userId]);
  const replaceCacheKey = useCallback(
    (key: string) => `${cacheScope}:${key}`,
    [cacheScope],
  );
  const getData = useCallback(async ({ ignoreCache = false } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setData(dataLoading);

    if (!cacheScope) {
      setData({
        error: null,
        loading: false,
        value: dataLoading.value,
      });
      return;
    }

    try {
      let explorationData = ignoreCache
        ? null
        : cache.get(CacheKey.EXPLORATION, replaceCacheKey);
      if (!explorationData) {
        explorationData = await getExploration();
        cache.set({
          key: CacheKey.EXPLORATION,
          keyReplace: replaceCacheKey,
          value: explorationData,
          ttl: EXPLORATION_CACHE_TTL,
        });
      }

      if (requestId !== requestIdRef.current) {
        return;
      }

      setData({
        error: null,
        loading: false,
        value: explorationData,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      logger.error(error, '获取发现数据失败');
      setData({
        error,
        loading: false,
        value: dataLoading.value,
      });
    }
  }, [cacheScope, replaceCacheKey]);
  const reload = useCallback(() => {
    if (cacheScope) {
      cache.remove(CacheKey.EXPLORATION, replaceCacheKey);
    }
    return getData({ ignoreCache: true });
  }, [cacheScope, getData, replaceCacheKey]);

  useEffect(() => {
    // 推荐结果和当前用户相关, 切换用户后需要跳过上一账号留下的内存缓存。
    const cacheScopeChanged = lastActiveCacheScope !== cacheScope;
    lastActiveCacheScope = cacheScope;
    getData({ ignoreCache: cacheScopeChanged });

    const unlistenMusicUpdated = playerEventemitter.listen(
      PlayerEventType.MUSIC_UPDATED,
      reload,
    );
    const unlistenMusicDeleted = playerEventemitter.listen(
      PlayerEventType.MUSIC_DELETED,
      reload,
    );
    const unlistenSingerUpdated = playerEventemitter.listen(
      PlayerEventType.SINGER_UPDATED,
      reload,
    );
    return () => {
      requestIdRef.current += 1;
      unlistenMusicUpdated();
      unlistenMusicDeleted();
      unlistenSingerUpdated();
    };
  }, [cacheScope, getData, reload]);

  return { data, reload };
};
