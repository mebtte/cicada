import getSelfMusicList from '@/server/get_self_music_list';
import styled from 'styled-components';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

const Style = styled.div``;

function Music({
  music,
}: {
  music: AsyncReturnType<typeof getSelfMusicList>['musicList'][0];
}) {
  return (
    <Style
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, {
          id: music.id,
        })
      }
    >
      music
    </Style>
  );
}

export default Music;
