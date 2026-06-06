import { SEARCH_KEYWORD_MAX_LENGTH } from '@/constants/artist';
import logger from '@/utils/logger';
import { Query } from '@/constants';
import searchArtist from '@/server/api/search_artist';
import DefaultCover from '@/asset/default_cover.jpeg';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { PAGE_SIZE } from '../constants';
import { Artist } from './constants';

type Data = {
  error: Error | null;
  loading: boolean;
  value: {
    total: number;
    artistList: Artist[];
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
      const d = await searchArtist({
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
          artistList: d.artistList.map((artist) => ({
            ...artist,
            avatar: artist.photos[0]?.asset || DefaultCover,
          })),
        },
      });
    } catch (error) {
      logger.error(error, '搜索艺人失败');
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
