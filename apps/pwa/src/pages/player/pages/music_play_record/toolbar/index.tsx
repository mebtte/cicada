import styled from 'styled-components';
import Filter from './filter';
import { TOOLBAR_HEIGHT } from '../constants';

const Style = styled.div`
  position: absolute;
  width: 100%;
  height: ${TOOLBAR_HEIGHT}px;
  left: 0;
  bottom: 0;

  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  backdrop-filter: blur(5px);
`;

function Toolbar() {
  return (
    <Style>
      <Filter />
    </Style>
  );
}

export default Toolbar;
