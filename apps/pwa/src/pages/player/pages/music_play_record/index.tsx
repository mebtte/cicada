import styled from 'styled-components';
import Page from '../page';
import Toolbar from './toolbar';
import MusicPlayRecordList from './music_play_record_list';

const Style = styled(Page)`
  position: relative;

  display: flex;
  flex-direction: column;
`;

function MusicPlayRecord() {
  return (
    <Style>
      <MusicPlayRecordList />
      <Toolbar />
    </Style>
  );
}

export default MusicPlayRecord;
