import styled from 'styled-components';
import Page from '../page';
import MusicList from './music_list';

const Style = styled(Page)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgb(247 247 247);
`;

function DownloadingMusic() {
  return (
    <Style>
      <MusicList />
    </Style>
  );
}

export default DownloadingMusic;
