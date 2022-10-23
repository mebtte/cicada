import styled from 'styled-components';
import Page from '../page';
import SingerList from './singer_list';
import Toolbar from './toolbar';
import CreateSingerDialog from './create_singer_dialog';

const Style = styled(Page)`
  position: relative;

  display: flex;
  flex-direction: column;
`;

function MySinger() {
  return (
    <Style>
      <SingerList />
      <Toolbar />

      <CreateSingerDialog />
    </Style>
  );
}

export default MySinger;
