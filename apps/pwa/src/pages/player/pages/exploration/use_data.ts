import logger from '@/utils/logger';
import getExploration from '@/server/api/get_exploration';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelectedServer, useUser } from '@/global_states/server';
import { ExplorationData } from './constants';
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
    artistList: [],
    publicMusicbillList: [],
    recentMusicList: [],
    recentArtistList: [],
    recentPublicMusicbillList: [],
  },
};

export default () => {
  const selectedServer = useSelectedServer();
  const user = useUser();
  const selectedServerOrigin = selectedServer?.origin;
  const userId = user?.id;
  const [data, setData] = useState<Data>(dataLoading);
  const requestIdRef = useRef(0);
  // 仅作为"是否处于已登录会话"的判定; 发现页数据不再做缓存, 每次都直接请求。
  const sessionReady = useMemo(
    () => Boolean(selectedServerOrigin && userId),
    [selectedServerOrigin, userId],
  );
  const getData = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setData(dataLoading);

    if (!sessionReady) {
      setData({
        error: null,
        loading: false,
        value: dataLoading.value,
      });
      return;
    }

    try {
      const explorationData = await getExploration();

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
  }, [sessionReady]);
  const reload = useCallback(() => getData(), [getData]);

  useEffect(() => {
    getData();

    const unlistenArtistUpdated = playerEventemitter.listen(
      PlayerEventType.ARTIST_UPDATED,
      reload,
    );
    return () => {
      requestIdRef.current += 1;
      unlistenArtistUpdated();
    };
  }, [getData, reload]);

  return { data, reload };
};
