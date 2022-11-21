import logger from '#/utils/logger';
import { Query } from '@/constants';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import getSelfMusicbillCollectionList from '@/server/get_self_musicbill_collection_list';
import getRandomCover from '@/utils/get_random_cover';
import { PAGE_SIZE, Musicbill } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

interface Data {
  error: Error | null;
  loading: boolean;
  value: {
    musicbillList: Musicbill[];
    total: number;
  } | null;
}
const dataLoading: Data = {
  error: null,
  loading: true,
  value: null,
};

export default () => {
  const { keyword = '', page: pageString } = useQuery<
    Query.KEYWORD | Query.PAGE
  >();
  const page = pageString ? Number(pageString) || 1 : 1;

  const [data, setData] = useState<Data>(dataLoading);
  const getPageMusicList = useCallback(
    async ({ keyword: k, page: p }: { keyword: string; page: number }) => {
      setData(dataLoading);
      try {
        const d = await getSelfMusicbillCollectionList({
          keyword: k,
          page: p,
          pageSize: PAGE_SIZE,
        });

        setData({
          error: null,
          loading: false,
          value: {
            total: d.total,
            musicbillList: d.musicbillList.map((mb) => ({
              ...mb,
              cover: mb.cover || getRandomCover(),
              user: {
                ...mb.user,
                avatar: mb.user.avatar || getRandomCover(),
              },
            })),
          },
        });
      } catch (e) {
        logger.error(e, '获取我的音乐列表失败');
        setData({
          error: e,
          loading: false,
          value: null,
        });
      }
    },
    [],
  );
  const reload = useCallback(
    () => getPageMusicList({ keyword, page }),
    [getPageMusicList, keyword, page],
  );

  useEffect(() => {
    getPageMusicList({ keyword, page });
  }, [getPageMusicList, keyword, page]);

  useEffect(() => {
    const unlistenChange = playerEventemitter.listen(
      PlayerEventType.MUSICBILL_COLLECTION_CHANGE,
      reload,
    );
    return unlistenChange;
  }, [reload]);

  return {
    page,
    data,
    reload,
  };
};
