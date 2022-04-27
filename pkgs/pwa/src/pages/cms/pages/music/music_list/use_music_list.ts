import { useCallback, useEffect, useState } from 'react';

import logger from '@/platform/logger';
import cmsGetMusicList, { SearchKey } from '@/server/cms_get_music_list';
import { Music, PAGE_SIZE } from '../constants';
import eventemitter, { EventType } from '../eventemitter';

export default ({
  page,
  searchKey,
  searchValue,
}: {
  page: number;
  searchKey: SearchKey;
  searchValue: string;
}) => {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [musicList, setMusicList] = useState<Music[]>([]);
  const [total, setTotal] = useState(0);
  const getMusicList = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await cmsGetMusicList({
        page,
        pageSize: PAGE_SIZE,
        searchKey,
        searchValue,
      });
      setTotal(data.total);
      setMusicList(
        data.list.map((m) => ({
          id: m.id,
          cover: m.cover,
          name: m.name,
          alias: m.alias,
          type: m.type,
          singers: m.singers,
          createTime: new Date(m.create_time),
          sq: m.sq,
          hq: m.hq,
          ac: m.ac,
          mvLink: m.mv_link,
          forkFrom: m.fork_from,
          recommendable: !!m.recommendable,
        })),
      );
    } catch (e) {
      logger.error(e, { description: '获取音乐列表失败', report: true });
      setError(e);
    }
    setLoading(false);
  }, [searchKey, searchValue, page]);

  useEffect(() => {
    getMusicList();

    eventemitter.on(
      EventType.MUSIC_CREATED_OR_UPDATED_OR_DELETED,
      getMusicList,
    );
    return () =>
      void eventemitter.off(
        EventType.MUSIC_CREATED_OR_UPDATED_OR_DELETED,
        getMusicList,
      );
  }, [getMusicList]);

  return { error, loading, musicList, total, retry: getMusicList };
};
