import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import logger from '@/utils/logger';
import { Query } from '@/constants';
import searchMusic from '@/server/api/search_music';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { MusicWithSingerAliases } from '../../../constants';
import { PAGE_SIZE } from '../constants';

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
      value: {
        total: number;
        musicList: MusicWithSingerAliases[];
      };
    };
const dataLoading: Data = {
  error: null,
  loading: true,
  value: null,
};

export default () => {
  const { keyword = '', page } = useQuery<Query.KEYWORD | Query.PAGE>();
  const pageNumber = (page ? Number(page) : 1) || 1;
  const [data, setData] = useState<Data>(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      const d = await searchMusic({
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
          musicList: d.musicList.map((music, index) => ({
            ...music,
            index: d.total - index - (pageNumber - 1) * PAGE_SIZE,
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
