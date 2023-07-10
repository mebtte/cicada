import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import {
  MdPlayArrow,
  MdReadMore,
  MdOutlinePostAdd,
  MdPlaylistAdd,
  MdOutlineEdit,
  MdOutlineDownload,
  MdShare,
} from 'react-icons/md';
import p from '@/global_states/profile';
import { IS_IPAD, IS_IPHONE } from '@/constants/browser';
import notice from '@/utils/notice';
import logger from '@/utils/logger';
import { ROOT_PATH } from '@/constants/route';
import { Query } from '@/constants';
import { saveAs } from 'file-saver';
import formatMusicFilename from '#/utils/format_music_filename';
import e, { EventType } from './eventemitter';
import { MINI_INFO_HEIGHT, MusicDetail } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.div`
  z-index: 1;

  position: sticky;
  top: ${MINI_INFO_HEIGHT}px;
  padding: 8px 20px;

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
  const profile = p.useState()!;
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
        <IconButton
          onClick={() =>
            window.navigator.clipboard
              .writeText(
                `${window.location.origin}/#${ROOT_PATH.PLAYER}?${Query.MUSIC_DRAWER_ID}=${music.id}`,
              )
              .then(() => notice.info('已复制音乐链接'))
              .catch((error) => {
                logger.error(error, '复制音乐链接失败');
                return notice.error(error.message);
              })
          }
        >
          <MdShare />
        </IconButton>
      </div>
      {profile.admin || profile.id === music.createUser.id ? (
        <IconButton onClick={() => e.emit(EventType.OPEN_EDIT_MENU, null)}>
          <MdOutlineEdit />
        </IconButton>
      ) : null}
    </Style>
  );
}

export default Toolbar;
