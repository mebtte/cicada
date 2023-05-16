import { useCallback, useEffect, useState } from 'react';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import useQuery from '@/utils/use_query';
import e, { EventType } from '../eventemitter';
import useDynamicZIndex from '../use_dynamic_z_index';

export default () => {
  const navigate = useNavigate();
  const onClose = useCallback(
    () =>
      navigate({
        query: {
          [Query.SINGER_DRAWER_ID]: '',
        },
      }),
    [navigate],
  );
  const { singer_drawer_id: urlId } = useQuery<Query.SINGER_DRAWER_ID>();
  const [id, setId] = useState(urlId);

  useEffect(() => {
    setId((i) => urlId || i);
  }, [urlId]);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_SINGER_DRAWER, (data) =>
      navigate({
        query: {
          [Query.SINGER_DRAWER_ID]: data.id,
        },
      }),
    );
    return unlistenOpen;
  }, [navigate]);

  return {
    zIndex: useDynamicZIndex(EventType.OPEN_SINGER_DRAWER),
    id,
    open: !!urlId,
    onClose,
  };
};
