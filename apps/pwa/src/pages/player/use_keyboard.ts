import useNavigate from '@/utils/use_navigate';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { useEffect } from 'react';
import notice from '@/utils/notice';
import e, { EventType } from './eventemitter';
import { QueueMusic, Musicbill } from './constants';

export default ({
  paused,
  queueMusic,
  musicbillList,
}: {
  paused: boolean;
  queueMusic?: QueueMusic;
  musicbillList: Musicbill[];
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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

        case 'q':
        case 'w': {
          if (!paused && queueMusic && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            notice.error('请先暂停音乐后再使用快捷键退出');
          }
          break;
        }

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          if (event.metaKey || event.ctrlKey) {
            const index = Number(event.key);
            const musicbill = musicbillList[index - 1] as Musicbill | undefined;
            if (musicbill) {
              event.preventDefault();

              navigate({
                path:
                  ROOT_PATH.PLAYER +
                  PLAYER_PATH.MUSICBILL.replace(':id', musicbill.id),
              });
            }
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, paused, queueMusic, musicbillList]);
};
