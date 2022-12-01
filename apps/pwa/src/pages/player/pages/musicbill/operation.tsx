import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdRefresh, MdPlaylistAdd, MdEdit, MdDownload } from 'react-icons/md';
import { RequestStatus } from '@/constants';
import notice from '#/utils/notice';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { Musicbill } from '../../constants';
import e, { EventType } from './eventemitter';
import { exportMusicbill } from '../../utils';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

function Operation({ musicbill }: { musicbill: Musicbill }) {
  const { status, musicList } = musicbill;
  return (
    <Style>
      <IconButton
        disabled={status !== RequestStatus.SUCCESS}
        onClick={() =>
          musicList.length
            ? playerEventemitter.emit(
                PlayerEventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
                {
                  musicList,
                },
              )
            : notice.error('乐单暂无音乐')
        }
      >
        <MdPlaylistAdd />
      </IconButton>
      <IconButton onClick={() => exportMusicbill(musicbill.id)}>
        <MdDownload />
      </IconButton>
      <IconButton
        loading={status === RequestStatus.LOADING}
        disabled={status !== RequestStatus.SUCCESS}
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL_DETAIL, {
            id: musicbill.id,
          })
        }
      >
        <MdRefresh />
      </IconButton>
      <IconButton onClick={() => e.emit(EventType.OPEN_EDIT_MENU, null)}>
        <MdEdit />
      </IconButton>
    </Style>
  );
}

export default Operation;
