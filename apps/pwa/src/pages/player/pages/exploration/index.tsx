import styled from 'styled-components';
import { HEADER_HEIGHT } from '../../constants';
import Page from '../page';

const Style = styled(Page)`
  padding: ${HEADER_HEIGHT}px 0 20px 0;

  overflow: auto;
`;

function Exploration() {
  return <Style>exploration</Style>;
}

export default Exploration;
