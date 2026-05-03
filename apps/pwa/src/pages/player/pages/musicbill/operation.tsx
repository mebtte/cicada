import styled from 'styled-components';
import Button from '@/components_next/button';
import {
  MdRefresh,
  MdPlaylistAdd,
  MdOutlineEdit,
  MdOutlinePeopleAlt,
  MdOutlineDownload,
} from 'react-icons/md';
import { RequestStatus } from '@/constants';
import notice from '@/utils/notice';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/utils/upper_case_first_letter';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { Musicbill } from '../../constants';
import e, { EventType } from './eventemitter';
import { ENABLE_FILE_SYSTEM } from '@/constants/browser';
import { downloadMusicListByFileSystem } from '../../utils';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

function Operation({ musicbill }: { musicbill: Musicbill }) {
  const { status, musicList } = musicbill;
  return (
    <Style>
      <Button
        square
        variant="plain"
        size="sm"
        disabled={status !== RequestStatus.SUCCESS}
        onClick={() =>
          musicList.length
            ? playerEventemitter.emit(
                PlayerEventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
                {
                  musicList,
                },
              )
            : notice.error(upperCaseFirstLetter(t('no_music_in_musicbill')))
        }
      >
        <MdPlaylistAdd />
      </Button>
      <Button
        square
        variant="plain"
        size="sm"
        loading={status === RequestStatus.LOADING}
        disabled={status !== RequestStatus.SUCCESS}
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
            id: musicbill.id,
            silence: false,
          })
        }
      >
        <MdRefresh />
      </Button>
      <Button square variant="plain" size="sm" onClick={() => e.emit(EventType.OPEN_EDIT_MENU, null)}>
        <MdOutlineEdit />
      </Button>
      {ENABLE_FILE_SYSTEM ? (
        <Button
          square
          variant="plain"
          size="sm"
          disabled={!musicbill.musicList.length}
          onClick={() => downloadMusicListByFileSystem(musicbill.musicList)}
        >
          <MdOutlineDownload />
        </Button>
      ) : null}
      <Button
        square
        variant="plain"
        size="sm"
        onClick={() =>
          playerEventemitter.emit(
            PlayerEventType.OPEN_MUSICBILL_SHARED_USER_DRAWER,
            { id: musicbill.id },
          )
        }
      >
        <MdOutlinePeopleAlt />
      </Button>
    </Style>
  );
}

export default Operation;
