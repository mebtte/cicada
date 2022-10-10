import styled from 'styled-components';
import Page from '../page';
import Toolbar from './toolbar';
import MusicList from './music_list';
import CreateMusicDialog from './create_music_dialog';

const Style = styled(Page)`
  display: flex;
  flex-direction: column;
`;

function MyMusic() {
  return (
    <Style>
      <MusicList />
      <Toolbar />

      <CreateMusicDialog />
    </Style>
  );
}

export default MyMusic;
