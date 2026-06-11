import styled from 'styled-components';
import Button from '@/components/button';
import { AddBox } from '@/components/icon';
import { TOOLBAR_HEIGHT } from '../constants';
import { CONTROLLER_FLOATING_RESERVED_HEIGHT } from '../../../constants';
import { PAGE_HORIZONTAL_PADDING } from '../../page';
import Filter from './filter';
import e, { EventType } from '../eventemitter';

const openCreateUserDialog = () =>
  e.emit(EventType.OPEN_CREATE_USER_DIALOG, null);

const Style = styled.div`
  position: absolute;
  width: 100%;
  height: ${TOOLBAR_HEIGHT}px;
  left: 0;
  bottom: ${CONTROLLER_FLOATING_RESERVED_HEIGHT};

  padding: 0 ${PAGE_HORIZONTAL_PADDING};

  display: flex;
  align-items: center;
  gap: 10px;

  backdrop-filter: blur(5px);
`;

function Toolbar() {
  return (
    <Style>
      <Button square variant="ghost" size="sm" onClick={openCreateUserDialog}>
        <AddBox />
      </Button>
      <Filter />
    </Style>
  );
}

export default Toolbar;
