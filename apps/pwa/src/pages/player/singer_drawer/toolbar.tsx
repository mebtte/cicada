import styled from 'styled-components';
import Button from '@/components/button';
import { MdPlaylistAdd, MdCopyAll } from 'react-icons/md';
import notice from '@/utils/notice';
import logger from '@/utils/logger';
import { t } from '@/i18n';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { Singer } from './constants';

const Style = styled.div`
  position: sticky;
  bottom: 0;
  height: calc(50px + env(safe-area-inset-bottom, 0));
  padding: 0 20px env(safe-area-inset-bottom, 0) 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  backdrop-filter: blur(5px);

  > .left {
    flex: 1;
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 5px;
  }
`;

function Toolbar({ singer }: { singer: Singer }) {
  return (
    <Style>
      <div className="left">
        <Button
          square
          variant="plain"
          size="sm"
          onClick={() =>
            singer.musicList.length
              ? playerEventemitter.emit(
                  PlayerEventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
                  {
                    musicList: singer.musicList,
                  },
                )
              : notice.error(t('no_music_singer_warning'))
          }
        >
          <MdPlaylistAdd />
        </Button>
        <Button
          square
          variant="plain"
          size="sm"
          onClick={() =>
            window.navigator.clipboard
              .writeText(singer.name)
              .then(() => notice.info(t('singers_name_copied')))
              .catch((error) => {
                logger.error(error, "Failed to copy singer's name");
                return notice.error(error.message);
              })
          }
        >
          <MdCopyAll />
        </Button>
      </div>
    </Style>
  );
}

export default Toolbar;
