import logger from '@/utils/logger';
import getExploration from '@/server/api/get_exploration';
import { useCallback, useEffect, useState } from 'react';
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

export default () => {
  const [data, setData] = useState<Data>(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      let explorationData = cache.get(CacheKey.EXPLORATION);
      if (!explorationData) {
        explorationData = await getExploration();
        cache.set({
          key: CacheKey.EXPLORATION,
          value: explorationData,
          ttl: 1000 * 60 * 5,
        });
      }
      setData({
        error: null,
        loading: false,
        value: explorationData,
      });
    } catch (error) {
      logger.error(error, '获取发现数据失败');
      setData({
        error,
        loading: false,
        value: dataLoading.value,
      });
    }
  }, []);
  const reload = useCallback(() => {
    cache.remove(CacheKey.EXPLORATION);
    return getData();
  }, [getData]);

  useEffect(() => {
    getData();

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
      unlistenMusicUpdated();
      unlistenMusicDeleted();
      unlistenSingerUpdated();
    };
  }, [getData, reload]);

  return { data, reload };
};
