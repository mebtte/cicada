import logger from '#/utils/logger';
import { Query } from '@/constants';
import getMusicPlayRecord from '@/server/get_music_play_record';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { MusicPlayRecord, PAGE_SIZE } from './constants';

type Data = {
  loading: boolean;
  error: Error | null;
  playRecords: MusicPlayRecord[];
};
const dataLoading: Data = {
  loading: true,
  error: null,
  playRecords: [],
};

export default () => {
  const { keyword, page: pageString } = useQuery<Query>();
  const page = (pageString ? Number(pageString) : 1) || 1;

  const [data, setData] = useState<Data>(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      const d = await getMusicPlayRecord({
        page,
        pageSize: PAGE_SIZE,
        keyword: keyword || '',
      });
      setData({
        loading: false,
        error: null,
        playRecords: d,
      });
    } catch (error) {
      logger.error(error, '获取音乐播放记录失败');
      setData({
        loading: false,
        error,
        playRecords: [],
      });
    }
  }, [keyword, page]);

  useEffect(() => {
    getData();
  }, [getData]);

  return { data, page };
};
