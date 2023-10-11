import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdPlaylistAdd, MdOutlineEdit, MdCopyAll } from 'react-icons/md';
import notice from '@/utils/notice';
import logger from '@/utils/logger';
import { t } from '@/i18n';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { Singer } from './constants';
import e, { EventType } from './eventemitter';

const openEditMenu = () => e.emit(EventType.OPEN_EDIT_MENU, null);
const Style = styled.div`
  z-index: 1;

  position: sticky;
  bottom: 0;
  height: 50px;
  padding: 0 20px;

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
        <IconButton
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
        </IconButton>
        <IconButton
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
        </IconButton>
      </div>
      {singer.editable ? (
        <IconButton onClick={openEditMenu}>
          <MdOutlineEdit />
        </IconButton>
      ) : null}
    </Style>
  );
}

export default Toolbar;
