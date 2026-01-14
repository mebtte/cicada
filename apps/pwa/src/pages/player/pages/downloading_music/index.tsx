import styled from 'styled-components';
import Page from '../page';
import Toolbar from './toolbar';
import MusicList from './music_list';

const Style = styled(Page)`
  display: flex;
  flex-direction: column;
`;

function DownloadingMusic() {
  return (
    <Style>
      <MusicList />
      <Toolbar />
    </Style>
  );
}

export default DownloadingMusic;
