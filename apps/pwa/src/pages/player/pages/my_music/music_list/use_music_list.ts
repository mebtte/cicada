import logger from '#/utils/logger';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import getSelfMusicList from '@/server/get_self_music_list';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MusicWithIndex } from '../../../constants';
import { PAGE_SIZE } from '../constants';
import em, { EventType } from '../eventemitter';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

export default () => {
  const requestIdRef = useRef(0);
  const navigate = useNavigate();

  const { keyword = '', page: pageString } = useQuery<
    Query.KEYWORD | Query.PAGE
  >();
  const page = pageString ? Number(pageString) || 1 : 1;
  const onPageChange = useCallback(
    (p: number) =>
      navigate({
        query: {
          [Query.PAGE]: p,
        },
      }),
    [navigate],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [musicList, setMusicList] = useState<MusicWithIndex[]>([]);
  const getPageMusicList = useCallback(
    async ({ keyword: k, page: p }: { keyword: string; page: number }) => {
      const requestId = Math.random();
      requestIdRef.current = requestId;

      setError(null);
      setLoading(true);
      try {
        const { total: t, musicList: ml } = await getSelfMusicList({
          keyword: k,
          page: p,
          pageSize: PAGE_SIZE,
        });

        if (requestId === requestIdRef.current) {
          setTotal(t);
          setMusicList(
            ml.map((m, index) => ({
              index: index + 1,
              music: m,
            })),
          );
        }
      } catch (e) {
        if (requestId === requestIdRef.current) {
          logger.error(e, '获取我的音乐列表失败');
          setError(e);
        }
      }
      setLoading(false);
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
    loading,
    error,
    keyword,
    page,
    onPageChange,
    total,
    musicList,
    reload,
  };
};
