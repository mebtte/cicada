import logger from '@/utils/logger';
import type { Query } from '@/constants';
import getMusicPlayRecordList from '@/server/api/get_music_play_record_list';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { PAGE_SIZE, MusicPlayRecord } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import e, { EventType } from '../eventemitter';

interface Data {
  error: Error | null;
  loading: boolean;
  value: {
    musicPlayRecordList: MusicPlayRecord[];
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
  const getPageMusicPlayRecordList = useCallback(
    async ({ keyword: k, page: p }: { keyword: string; page: number }) => {
      setData(dataLoading);
      try {
        const d = await getMusicPlayRecordList({
          keyword: k,
          page: p,
          pageSize: PAGE_SIZE,
        });

        setData({
          error: null,
          loading: false,
          value: {
            total: d.total,
            musicPlayRecordList: d.musicPlayRecordList.map((mpr, i) => ({
              ...mpr,
              index: d.total - i,
            })),
          },
        });
      } catch (error) {
        logger.error(error, '获取我的音乐列表失败');
        setData({
          error,
          loading: false,
          value: null,
        });
      }
    },
    [],
  );
  const reload = useCallback(
    () => getPageMusicPlayRecordList({ keyword, page }),
    [getPageMusicPlayRecordList, keyword, page],
  );

  useEffect(() => {
    getPageMusicPlayRecordList({ keyword, page });
  }, [getPageMusicPlayRecordList, keyword, page]);

  useEffect(() => {
    const unlistenMusicDeleted = playerEventemitter.listen(
      PlayerEventType.MUSIC_DELETED,
      reload,
    );
    const unlistenMusicPlayRecordDeleted = e.listen(
      EventType.MUSIC_PLAY_RECORD_DELETED,
      reload,
    );
    return () => {
      unlistenMusicDeleted();
      unlistenMusicPlayRecordDeleted();
    };
  }, [reload]);

  return {
    page,
    data,
    reload,
  };
};
