import styled from 'styled-components';
import Button from '@/components/button';
import {
  MdRefresh,
  MdPlaylistAdd,
  MdOutlineEdit,
  MdOutlinePeopleAlt,
} from 'react-icons/md';
import { IconExport } from '@/components/icon';
import { RequestStatus } from '@/constants';
import notice from '@/utils/notice';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/utils/upper_case_first_letter';
import { CSSVariable } from '@/global_style';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { Musicbill } from '../../constants';
import e, { EventType } from './eventemitter';
import { ENABLE_FILE_SYSTEM } from '@/constants/browser';
import { openExportMusicListDialog } from '../../export_music_list';
import addMusicListToPlaylist from '../../add_to_playlist';

const Style = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
`;

function Operation({ musicbill }: { musicbill: Musicbill }) {
  const { status, musicList, sharedUserList } = musicbill;
  const shared = sharedUserList.length > 0;
  return (
    <Style>
      <Button
        square
        variant="ghost"
        size="sm"
        disabled={status !== RequestStatus.SUCCESS}
        onClick={() =>
          musicList.length
            ? addMusicListToPlaylist(musicList)
            : notice.error(upperCaseFirstLetter(t('no_music_in_musicbill')))
        }
      >
        <MdPlaylistAdd />
      </Button>
      <Button
        square
        variant="ghost"
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
      <Button
        square
        variant="ghost"
        size="sm"
        onClick={() => e.emit(EventType.OPEN_EDIT_MENU, null)}
      >
        <MdOutlineEdit />
      </Button>
      {ENABLE_FILE_SYSTEM ? (
        <Button
          square
          variant="ghost"
          size="sm"
          disabled={!musicbill.musicList.length}
          onClick={() => openExportMusicListDialog(musicbill.musicList)}
        >
          <IconExport size="1em" />
        </Button>
      ) : null}
      <Button
        square
        variant={shared ? 'primary' : 'ghost'}
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
