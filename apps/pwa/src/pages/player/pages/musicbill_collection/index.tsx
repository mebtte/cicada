import styled from 'styled-components';
import Page from '../page';
import Toolbar from './toolbar';
import MusicbillList from './musicbill_list';

const Style = styled(Page)`
  position: relative;

  display: flex;
  flex-direction: column;
`;

function MusicbillCollection() {
  return (
    <Style>
      <MusicbillList />
      <Toolbar />
    </Style>
  );
}

export default MusicbillCollection;
