import logger from '@/utils/logger';
import getSinger from '@/server/api/get_singer';
import { useCallback, useEffect, useState } from 'react';
import { Singer } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

type Data =
  | {
      error: null;
      loading: true;
      value: null;
    }
  | {
      error: Error;
      loading: false;
      value: null;
    }
  | {
      error: null;
      loading: false;
      value: Singer;
    };
const dataLoading: Data = {
  error: null,
  loading: true,
  value: null,
};

export default (singerId: string) => {
  const [data, setData] = useState<Data>(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      const singer = await getSinger(singerId);
      setData({
        error: null,
        loading: false,
        value: singer,
      });
    } catch (error) {
      logger.error(error, 'Fail to get singer');
      setData({
        error,
        loading: false,
        value: null,
      });
    }
  }, [singerId]);

  useEffect(() => {
    getData();
  }, [getData]);

  useEffect(() => {
    const unlistenSingerUpdated = playerEventemitter.listen(
      PlayerEventType.SINGER_UPDATED,
      ({ singer }) => {
        if (singer.id === singerId) {
          getData();
        }
      },
    );
    return unlistenSingerUpdated;
  }, [getData, singerId]);

  useEffect(() => {
    const musicUpdatedOrDeleted = ({ id }: { id: string }) => {
      if (data.value?.musicList.find((m) => m.id === id)) {
        getData();
      }
    };
    const unlistenMusicUpdated = playerEventemitter.listen(
      PlayerEventType.MUSIC_UPDATED,
      musicUpdatedOrDeleted,
    );
    const unlistenMusicDeleted = playerEventemitter.listen(
      PlayerEventType.MUSIC_DELETED,
      musicUpdatedOrDeleted,
    );
    return () => {
      unlistenMusicUpdated();
      unlistenMusicDeleted();
    };
  }, [data, getData]);

  return { data, reload: getData };
};
