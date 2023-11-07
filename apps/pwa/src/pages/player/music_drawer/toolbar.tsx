import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import {
  MdPlayArrow,
  MdReadMore,
  MdOutlinePostAdd,
  MdPlaylistAdd,
  MdOutlineEdit,
  MdOutlineDownload,
} from 'react-icons/md';
import { IS_IPAD, IS_IPHONE } from '@/constants/browser';
import { saveAs } from 'file-saver';
import formatMusicFilename from '#/utils/format_music_filename';
import { useUser } from '@/global_states/server';
import e, { EventType } from './eventemitter';
import { MusicDetail } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.div`
  z-index: 1;

  position: sticky;
  bottom: 0;
  height: calc(50px + env(safe-area-inset-bottom, 0));
  padding: 0 20px env(safe-area-inset-bottom, 0) 20px;

  display: flex;
  align-items: center;
  gap: 5px;

  backdrop-filter: blur(5px);

  > .left {
    flex: 1;
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 5px;
  }
`;

function Toolbar({ music }: { music: MusicDetail }) {
  const user = useUser()!;

  return (
    <Style>
      <div className="left">
        <IconButton
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.ACTION_PLAY_MUSIC, {
              music,
            })
          }
        >
          <MdPlayArrow />
        </IconButton>
        <IconButton
          onClick={() =>
            playerEventemitter.emit(
              PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
              {
                music,
              },
            )
          }
        >
          <MdReadMore />
        </IconButton>
        <IconButton
          onClick={() =>
            playerEventemitter.emit(
              PlayerEventType.OPEN_MUSICBILL_MUSIC_DRAWER,
              {
                music,
              },
            )
          }
        >
          <MdOutlinePostAdd />
        </IconButton>
        <IconButton
          onClick={() =>
            playerEventemitter.emit(
              PlayerEventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
              {
                musicList: [music],
              },
            )
          }
        >
          <MdPlaylistAdd />
        </IconButton>
        {IS_IPAD || IS_IPHONE ? null : (
          <IconButton
            onClick={() => {
              const parts = music.asset.split('.');
              return saveAs(
                music.asset,
                formatMusicFilename({
                  name: music.name,
                  singerNames: music.singers.map((s) => s.name),
                  ext: `.${parts[parts.length - 1]}`,
                }),
              );
            }}
          >
            <MdOutlineDownload />
          </IconButton>
        )}
      </div>
      {user.admin || user.id === music.createUser.id ? (
        <IconButton onClick={() => e.emit(EventType.OPEN_EDIT_MENU, null)}>
          <MdOutlineEdit />
        </IconButton>
      ) : null}
    </Style>
  );
}

export default Toolbar;
