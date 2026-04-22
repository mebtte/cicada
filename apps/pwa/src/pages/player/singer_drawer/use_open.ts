import { useCallback, useEffect, useState } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import useQuery from '@/utils/use_query';
import { useTheme } from '@/global_states/theme';
import e, { EventType } from '../eventemitter';
import useDynamicZIndex from '../use_dynamic_z_index';

const getSingerPath = (id: string) =>
  `${ROOT_PATH.PLAYER}${PLAYER_PATH.SINGER.replace(':id', id)}`;

export default () => {
  const navigate = useNavigate();
  const routerNavigate = useRouterNavigate();
  const { miniMode } = useTheme();
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
    if (miniMode && urlId) {
      routerNavigate(getSingerPath(urlId), { replace: true });
    }
  }, [miniMode, routerNavigate, urlId]);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_SINGER_DRAWER, (data) =>
      window.setTimeout(
        () => {
          if (miniMode) {
            routerNavigate(getSingerPath(data.id));
            return;
          }
          navigate({
            query: {
              [Query.SINGER_DRAWER_ID]: data.id,
            },
          });
        },
        0,
      ),
    );
    return unlistenOpen;
  }, [miniMode, navigate, routerNavigate]);

  return {
    zIndex: useDynamicZIndex(EventType.OPEN_SINGER_DRAWER),
    id,
    miniMode,
    open: !miniMode && !!urlId,
    onClose,
  };
};
