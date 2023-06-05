import styled from 'styled-components';
import Page from '../page';
import { HEADER_HEIGHT } from '../../constants';

const Style = styled(Page)`
  padding-top: ${HEADER_HEIGHT}px;
`;

function Message() {
  return <Style>todo</Style>;
}

export default Message;
