import logger from '#/utils/logger';
import getSingerDetail from '@/server/get_singer_detail';
import { useCallback, useEffect, useState } from 'react';
import { Singer } from './constants';

type Data = {
  error: Error | null;
  loading: boolean;
  singer: Singer | null;
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
      const singer = await getSingerDetail(singerId);
      setData({
        error: null,
        loading: false,
        singer,
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

  return { data, reload: getData };
};
