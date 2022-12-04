import useNavigate from '@/utils/use_navigate';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { useEffect } from 'react';
import e, { EventType } from './eventemitter';

export default () => {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // const { activeElement } = document;
      // if (
      //   !activeElement ||
      //   activeElement.tagName === 'INPUT' ||
      //   activeElement.tagName === 'TEXTAREA'
      // ) {
      //   return;
      // }

      switch (event.key) {
        case 'f': {
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            navigate({
              path: `${ROOT_PATH.PLAYER}${PLAYER_PATH.SEARCH}`,
            });
            e.emit(EventType.FOCUS_SEARCH_INPUT, null);
          }
          break;
        }

        case 'l': {
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            e.emit(EventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER, null);
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);
};
