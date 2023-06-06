import logger from '@/utils/logger';
import { Query } from '@/constants';
import getMusicList from '@/server/api/get_music_list';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { PAGE_SIZE, Music } from '../constants';
import em, { EventType } from '../eventemitter';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

interface Data {
  error: Error | null;
  loading: boolean;
  value: {
    musicList: Music[];
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
        const d = await getMusicList({
          keyword: k,
          page: p,
          pageSize: PAGE_SIZE,
        });

        setData({
          error: null,
          loading: false,
          value: {
            total: d.total,
            musicList: d.musicList.map((music, index) => ({
              ...music,
              index: d.total - index - (p - 1) * PAGE_SIZE,
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
    const unlistenReload = em.listen(EventType.RELOAD_MUSIC_LIST, reload);
    const unlistenMusicUpdated = playerEventemitter.listen(
      PlayerEventType.MUSIC_UPDATED,
      reload,
    );
    const unlistenMusicDeleted = playerEventemitter.listen(
      PlayerEventType.MUSIC_DELETED,
      reload,
    );
    return () => {
      unlistenReload();
      unlistenMusicUpdated();
      unlistenMusicDeleted();
    };
  }, [reload]);

  return {
    page,
    data,
    reload,
  };
};
