import logger from '#/utils/logger';
import getExploration from '@/server/get_exploration';
import { useCallback, useEffect, useState } from 'react';
import { Exploration } from './constants';
import cache, { CacheKey } from './cache';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

type Data =
  | {
      error: Error;
      loading: false;
      data: null;
    }
  | {
      error: null;
      loading: true;
      data: null;
    }
  | {
      error: null;
      loading: false;
      data: Exploration;
    };
const dataLoading: Data = {
  error: null,
  loading: true,
  data: null,
};

export default () => {
  const [data, setData] = useState<Data>(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      let exploration = cache.get(CacheKey.EXPLORATION);
      if (!exploration) {
        exploration = await getExploration();
        cache.set({
          key: CacheKey.EXPLORATION,
          value: exploration,
          ttl: 1000 * 60,
        });
      }
      setData({
        error: null,
        loading: false,
        data: exploration,
      });
    } catch (error) {
      logger.error(error, '获取发现数据失败');
      setData({
        error,
        loading: false,
        data: null,
      });
    }
  }, []);

  useEffect(() => {
    getData();

    const onMusicUpdatedOrDeleted = () => {
      cache.remove(CacheKey.EXPLORATION);
      return getData();
    };
    const unlistenMusicUpdated = playerEventemitter.listen(
      PlayerEventType.MUSIC_UPDATED,
      onMusicUpdatedOrDeleted,
    );
    const unlistenMusicDeleted = playerEventemitter.listen(
      PlayerEventType.MUSIC_DELETED,
      onMusicUpdatedOrDeleted,
    );
    return () => {
      unlistenMusicUpdated();
      unlistenMusicDeleted();
    };
  }, [getData]);

  return { data, reload: getData };
};
