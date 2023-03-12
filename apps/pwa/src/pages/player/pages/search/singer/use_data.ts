import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/singer';
import logger from '#/utils/logger';
import { Query } from '@/constants';
import searchSinger from '@/server/api/search_singer';
import getRandomCover from '@/utils/get_random_cover';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { PAGE_SIZE } from '../constants';
import { Singer } from './constants';

type Data = {
  error: Error | null;
  loading: boolean;
  value: {
    total: number;
    singerList: Singer[];
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
    setData(dataLoading);
    try {
      const d = await searchSinger({
        keyword: keyword
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, SEARCH_KEYWORD_MAX_LENGTH),
        page: pageNumber,
        pageSize: PAGE_SIZE,
      });
      setData({
        error: null,
        loading: false,
        value: {
          total: d.total,
          singerList: d.singerList.map((s) => ({
            ...s,
            avatar: s.avatar || getRandomCover(),
          })),
        },
      });
    } catch (error) {
      logger.error(error, '搜索歌手失败');
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
