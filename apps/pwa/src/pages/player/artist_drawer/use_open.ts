import { useCallback, useEffect, useState } from 'react';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import useQuery from '@/utils/use_query';
import e, { EventType } from '../eventemitter';

export default () => {
  const navigate = useNavigate();
  const onClose = useCallback(
    () =>
      navigate({
        query: {
          [Query.ARTIST_DRAWER_ID]: '',
        },
      }),
    [navigate],
  );
  const { artist_drawer_id: urlId } = useQuery<Query.ARTIST_DRAWER_ID>();
  const [id, setId] = useState(urlId);

  useEffect(() => {
    setId((i) => urlId || i);
  }, [urlId]);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_ARTIST_DRAWER, (data) =>
      window.setTimeout(
        () =>
          navigate({
            query: {
              [Query.ARTIST_DRAWER_ID]: data.id,
            },
          }),
        0,
      ),
    );
    return unlistenOpen;
  }, [navigate]);

  return {
    id,
    open: !!urlId,
    onClose,
  };
};
