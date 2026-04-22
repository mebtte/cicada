import { useState, useEffect, useCallback } from 'react';
import {
  matchPath,
  useLocation,
  useNavigate as useRouterNavigate,
} from 'react-router-dom';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import useQuery from '@/utils/use_query';
import { useTheme } from '@/global_states/theme';
import eventemitter, { EventType } from '../eventemitter';

const getMusicPath = (id: string) =>
  `${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSIC.replace(':id', id)}`;

export default () => {
  const navigate = useNavigate();
  const routerNavigate = useRouterNavigate();
  const { pathname } = useLocation();
  const { miniMode } = useTheme();
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
  const musicMatch = matchPath(
    `${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSIC}`,
    pathname,
  );

  useEffect(() => {
    setId((i) => urlId || i);
  }, [urlId]);

  useEffect(() => {
    if (miniMode && urlId) {
      routerNavigate(getMusicPath(urlId), { replace: true });
    }
  }, [miniMode, routerNavigate, urlId]);

  useEffect(() => {
    const unlistenOpenMusicDrawer = eventemitter.listen(
      EventType.OPEN_MUSIC_DRAWER,
      (data) =>
        window.setTimeout(
          () => {
            if (miniMode) {
              routerNavigate(getMusicPath(data.id));
              return;
            }
            navigate({
              query: {
                [Query.MUSIC_DRAWER_ID]: data.id,
              },
            });
          },
          0,
        ),
    );
    return unlistenOpenMusicDrawer;
  }, [miniMode, navigate, routerNavigate]);

  useEffect(() => {
    const unlistenMusicDeleted = eventemitter.listen(
      EventType.MUSIC_DELETED,
      (data) => {
        if (musicMatch?.params.id === data.id) {
          if (window.history.length > 1) {
            routerNavigate(-1);
            return;
          }
          navigate({ path: ROOT_PATH.PLAYER });
          return;
        }
        if (data.id === id) {
          onClose();
        }
      },
    );
    return unlistenMusicDeleted;
  }, [id, musicMatch?.params.id, navigate, onClose, routerNavigate]);

  return {
    open: !miniMode && !!urlId,
    onClose,
    id,
    miniMode,
  };
};
