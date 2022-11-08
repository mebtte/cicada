import logger from '#/utils/logger';
import { Query } from '@/constants';
import searchMusic from '@/server/search_music';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { MusicWithIndex } from '../../../constants';
import { PAGE_SIZE } from '../constants';

type Data = {
  error: Error | null;
  loading: boolean;
  value: {
    total: number;
    musicList: MusicWithIndex[];
  } | null;
};
const dataLoading: Data = {
  error: null,
  loading: true,
  value: null,
};

export default () => {
  const { keyword = '', page } = useQuery<Query.KEYWORD | Query.PAGE>();
  const pageNumber = (page ? Number(page) : 1) || 1;
  const [data, setData] = useState(dataLoading);
  const getData = useCallback(async () => {
    if (!keyword) {
      return setData({
        error: null,
        loading: false,
        value: {
          total: 0,
          musicList: [],
        },
      });
    }
    setData(dataLoading);
    try {
      const d = await searchMusic({
        keyword,
        page: pageNumber,
        pageSize: PAGE_SIZE,
      });
      setData({
        error: null,
        loading: false,
        value: {
          total: d.total,
          musicList: d.musicList.map((music, index) => ({
            index: d.total - index - (pageNumber - 1) * PAGE_SIZE,
            music,
          })),
        },
      });
    } catch (error) {
      logger.error(error, '搜索音乐失败');
      setData({
        error,
        loading: false,
        value: null,
      });
    }
  }, [keyword, pageNumber]);

  useEffect(() => {
    getData();
  }, [getData]);

  return { data, reload: getData, page: pageNumber };
};
