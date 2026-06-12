import logger from '@/utils/logger';
import type { Query } from '@/constants';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { PAGE_SIZE, MusicPlayRecord } from '../constants';
import e, { EventType } from '../eventemitter';

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
        musicPlayRecordList: MusicPlayRecord[];
        total: number;
      };
    };
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
        const { default: getMusicPlayRecordList } = await import(
          '@/server/api/get_music_play_record_list'
        );
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
        logger.error(error, 'Failed to get music play record list');
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
  const removeLocalMusicPlayRecord = useCallback((recordId: number) => {
    setData((d) => {
      if (!d.value) {
        return d;
      }

      const musicPlayRecordList = d.value.musicPlayRecordList.filter(
        (mpr) => mpr.recordId !== recordId,
      );
      if (musicPlayRecordList.length === d.value.musicPlayRecordList.length) {
        return d;
      }

      return {
        ...d,
        value: {
          total: Math.max(0, d.value.total - 1),
          musicPlayRecordList,
        },
      };
    });
  }, []);

  useEffect(() => {
    getPageMusicPlayRecordList({ keyword, page });
  }, [getPageMusicPlayRecordList, keyword, page]);

  // 同步加载态给工具栏, 使刷新按钮在加载过程中呈现 loading
  useEffect(() => {
    e.emit(EventType.LOADING_CHANGE, { loading: data.loading });
  }, [data.loading]);

  useEffect(() => {
    // 监听工具栏的刷新按钮, 重新拉取当前播放记录
    const unlistenReload = e.listen(EventType.RELOAD, reload);
    const unlistenMusicPlayRecordDeleted = e.listen(
      EventType.MUSIC_PLAY_RECORD_DELETED,
      ({ recordId }) => removeLocalMusicPlayRecord(recordId),
    );
    const unlistenMusicPlayRecordDeleteFailed = e.listen(
      EventType.MUSIC_PLAY_RECORD_DELETE_FAILED,
      reload,
    );
    return () => {
      unlistenReload();
      unlistenMusicPlayRecordDeleted();
      unlistenMusicPlayRecordDeleteFailed();
    };
  }, [reload, removeLocalMusicPlayRecord]);

  return {
    page,
    data,
    reload,
  };
};
