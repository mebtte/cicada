import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/singer';
import logger from '#/utils/logger';
import { Query } from '@/constants';
import searchPublicMusicbill from '@/server/search_public_musicbill';
import getRandomCover from '@/utils/get_random_cover';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { PAGE_SIZE } from '../constants';
import { Musicbill } from './constants';

type Data = {
  error: Error | null;
  loading: boolean;
  value: {
    total: number;
    musicbillList: Musicbill[];
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
      const d = await searchPublicMusicbill({
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
          musicbillList: d.musicbillList.map((mm) => ({
            ...mm,
            cover: mm.cover || getRandomCover(),
            user: {
              ...mm.user,
              avatar: mm.user.avatar || getRandomCover(),
            },
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
