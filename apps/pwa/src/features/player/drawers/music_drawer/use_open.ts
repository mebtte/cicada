import { useState, useEffect, useCallback } from 'react';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import useQuery from '@/utils/use_query';
import eventemitter, { EventType } from '../../eventemitter';

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

  return {
    open: !!urlId,
    onClose,
    id,
  };
};
