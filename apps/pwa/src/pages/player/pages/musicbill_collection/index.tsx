import styled from 'styled-components';
import { HEADER_HEIGHT } from '../../constants';
import Page from '../page';

const Style = styled(Page)`
  padding-top: ${HEADER_HEIGHT}px;
`;

function MusicbillCollection() {
  return <Style>musicbill collection</Style>;
}

export default MusicbillCollection;
