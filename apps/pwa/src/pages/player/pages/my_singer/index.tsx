import styled from 'styled-components';
import { HEADER_HEIGHT } from '../../constants';
import Page from '../page';
import SingerList from './singer_list';
import Toolbar from './toolbar';

const Style = styled(Page)`
  position: relative;

  padding-top: ${HEADER_HEIGHT}px;

  display: flex;
  flex-direction: column;
`;

function MySinger() {
  return (
    <Style>
      <SingerList />
      <Toolbar />
    </Style>
  );
}

export default MySinger;
