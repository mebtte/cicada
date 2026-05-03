import styled from 'styled-components';
import Button from '@/components/button';
import {
  MdPlayArrow,
  MdReadMore,
  MdOutlinePostAdd,
  MdPlaylistAdd,
  MdOutlineDownload,
} from 'react-icons/md';
import { saveAs } from 'file-saver';
import formatMusicFilename from '@/utils/format_music_filename';
import { MusicDetail } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { ENABLE_FILE_SYSTEM } from '@/constants/browser';
import { downloadMusicListByFileSystem } from '../utils';

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
  return (
    <Style>
      <div className="left">
        <Button
          square
          variant="plain"
          size="sm"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.ACTION_PLAY_MUSIC, {
              music,
            })
          }
        >
          <MdPlayArrow />
        </Button>
        <Button
          square
          variant="plain"
          size="sm"
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
        </Button>
        <Button
          square
          variant="plain"
          size="sm"
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
        </Button>
        <Button
          square
          variant="plain"
          size="sm"
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
        </Button>
        <Button
          square
          variant="plain"
          size="sm"
          onClick={() =>
            ENABLE_FILE_SYSTEM
              ? downloadMusicListByFileSystem([music])
              : saveAs(
                  music.asset,
                  formatMusicFilename({
                    name: music.name,
                    singerNames: music.singers.map((s) => s.name),
                    ext: music.asset.split('.').at(-1)!,
                  }),
                )
          }
        >
          <MdOutlineDownload />
        </Button>
      </div>
    </Style>
  );
}

export default Toolbar;
