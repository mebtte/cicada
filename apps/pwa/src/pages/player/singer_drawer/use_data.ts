import day from '#/utils/day';
import excludeProperty from '#/utils/exclude_property';
import logger from '@/utils/logger';
import getSinger from '@/server/api/get_singer';
import DefaultCover from '@/asset/default_cover.jpeg';
import { useCallback, useEffect, useState } from 'react';
import { SingerDetail } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

type Data = {
  error: Error | null;
  loading: boolean;
  singer: SingerDetail | null;
};
const dataLoading: Data = {
  error: null,
  loading: true,
  singer: null,
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
        singer: {
          ...excludeProperty(singer, ['createTimestamp']),
          avatar: singer.avatar || DefaultCover,
          musicList: singer.musicList.map((music, index) => ({
            ...music,
            index: singer.musicList.length - index,
          })),
          createTime: day(singer.createTimestamp).format('YYYY-MM-DD'),
        },
      });
    } catch (error) {
      logger.error(error, '获取歌手详情失败');
      setData({
        error,
        loading: false,
        singer: null,
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

  return { data, reload: getData };
};
