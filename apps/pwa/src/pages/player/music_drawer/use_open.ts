import { useState, useEffect, useCallback } from 'react';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import useQuery from '@/utils/use_query';
import useDynamicZIndex from '../use_dynamic_z_index';
import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const navigate = useNavigate();
  const onClose = useCallback(
    () =>
      navigate({
        query: {
          [Query.MUSIC_DRAWER_ID]: '',
        },
      }),
    [navigate],
  );
  const { music_drawer_id: urlId } = useQuery<Query.MUSIC_DRAWER_ID>();
  const [id, setId] = useState(urlId);

  useEffect(() => {
    setId((i) => urlId || i);
  }, [urlId]);

  useEffect(() => {
    const unlistenOpenMusicDrawer = eventemitter.listen(
      EventType.OPEN_MUSIC_DRAWER,
      (data) =>
        window.setTimeout(
          () =>
            navigate({
              query: {
                [Query.MUSIC_DRAWER_ID]: data.id,
              },
            }),
          0,
        ),
    );
    return unlistenOpenMusicDrawer;
  }, [navigate]);

  useEffect(() => {
    const unlistenMusicDeleted = eventemitter.listen(
      EventType.MUSIC_DELETED,
      (data) => {
        if (data.id === id) {
          onClose();
        }
      },
    );
    return unlistenMusicDeleted;
  }, [id, onClose]);

  return {
    open: !!urlId,
    onClose,
    id,
    zIndex: useDynamicZIndex(EventType.OPEN_MUSIC_DRAWER),
  };
};
