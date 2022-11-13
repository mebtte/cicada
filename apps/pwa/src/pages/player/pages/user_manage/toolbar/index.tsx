import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdAdd } from 'react-icons/md';
import { TOOLBAR_HEIGHT } from '../constants';
import Filter from './filter';
import e, { EventType } from '../eventemitter';

const openCreateUserDialog = () =>
  e.emit(EventType.OPEN_CREATE_USER_DIALOG, null);

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
      <IconButton onClick={openCreateUserDialog}>
        <MdAdd />
      </IconButton>
      <Filter />
    </Style>
  );
}

export default Toolbar;
