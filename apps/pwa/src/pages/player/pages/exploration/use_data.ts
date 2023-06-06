import logger from '@/utils/logger';
import getExploration from '@/server/api/get_exploration';
import { useCallback, useEffect, useState } from 'react';
import {
  ExplorationItem,
  ExplorationItemType,
  ExplorationMusic,
  ExplorationPublicMusicbill,
  ExplorationSinger,
} from './constants';
import cache, { CacheKey } from './cache';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

type Data =
  | {
      error: Error;
      loading: false;
      value: ExplorationItem[];
    }
  | {
      error: null;
      loading: true;
      value: ExplorationItem[];
    }
  | {
      error: null;
      loading: false;
      value: ExplorationItem[];
    };
const dataLoading: Data = {
  error: null,
  loading: true,
  value: [],
};

export default () => {
  const [data, setData] = useState<Data>(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      let explorationData = cache.get(CacheKey.EXPLORATION);
      if (!explorationData) {
        const result = await getExploration();
        explorationData = [
          ...result.musicList.map(
            (m) =>
              ({
                type: ExplorationItemType.MUSIC,
                value: m,
              } as ExplorationMusic),
          ),
          ...result.singerList.map(
            (s) =>
              ({
                type: ExplorationItemType.SINGER,
                value: s,
              } as ExplorationSinger),
          ),
          ...result.publicMusicbillList.map(
            (mb) =>
              ({
                type: ExplorationItemType.PUBLIC_MUSICBILL,
                value: mb,
              } as ExplorationPublicMusicbill),
          ),
        ].sort(() => Math.random() * 2 - 1);
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
        value: [],
      });
    }
  }, []);

  useEffect(() => {
    getData();

    const destroyCacheAndReloadData = () => {
      cache.remove(CacheKey.EXPLORATION);
      return getData();
    };
    const unlistenMusicUpdated = playerEventemitter.listen(
      PlayerEventType.MUSIC_UPDATED,
      destroyCacheAndReloadData,
    );
    const unlistenMusicDeleted = playerEventemitter.listen(
      PlayerEventType.MUSIC_DELETED,
      destroyCacheAndReloadData,
    );
    const unlistenSingerUpdated = playerEventemitter.listen(
      PlayerEventType.SINGER_UPDATED,
      destroyCacheAndReloadData,
    );
    return () => {
      unlistenMusicUpdated();
      unlistenMusicDeleted();
      unlistenSingerUpdated();
    };
  }, [getData]);

  return { data, reload: getData };
};
