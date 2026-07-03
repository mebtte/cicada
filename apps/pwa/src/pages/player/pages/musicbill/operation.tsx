import styled from 'styled-components';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import {
  PlaylistAdd,
  Edit,
  People,
  PersonStar,
} from '@/components/icon';
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
      <Tooltip content={t('add_all_to_playlist')}>
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
          <PlaylistAdd />
        </Button>
      </Tooltip>
      <Tooltip content={t('edit')}>
        <Button
          square
          variant="ghost"
          size="sm"
          onClick={() => e.emit(EventType.OPEN_EDIT_MENU, null)}
        >
          <Edit />
        </Button>
      </Tooltip>
      <Tooltip content={t('shared_user')}>
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
          <People />
        </Button>
      </Tooltip>
      <Tooltip content={t('followed_artist')}>
        <Button
          square
          variant="ghost"
          size="sm"
          onClick={() =>
            playerEventemitter.emit(
              PlayerEventType.OPEN_MUSICBILL_FOLLOWED_ARTIST_DRAWER,
              { id: musicbill.id },
            )
          }
        >
          <PersonStar />
        </Button>
      </Tooltip>
    </Style>
  );
}

export default Operation;
