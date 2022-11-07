import styled from 'styled-components';
import Page from '../page';
import Toolbar from './toolbar';
import MusicList from './music_list';
import CreateMusicDialog from './create_music_dialog';
import { HEADER_HEIGHT } from '../../constants';

const Style = styled(Page)`
  position: relative;

  display: flex;
  flex-direction: column;

  padding-top: ${HEADER_HEIGHT}px;
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
