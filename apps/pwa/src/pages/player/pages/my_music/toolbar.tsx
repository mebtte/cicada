import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdAdd } from 'react-icons/md';
import Tooltip from '#/components/tooltip';
import Input from '#/components/input';
import e, { EventType } from './eventemitter';

const openCreateMusicDialog = () =>
  e.emit(EventType.OPEN_CREATE_MUSIC_DIALOG, null);
const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 10px 20px;

  > .filter {
    flex: 1;
    min-width: 0;
  }
`;

function Toolbar() {
  return (
    <Style>
      <Tooltip title="创建音乐">
        <IconButton onClick={openCreateMusicDialog}>
          <MdAdd />
        </IconButton>
      </Tooltip>
      <Input
        className="filter"
        inputProps={{
          placeholder: '查找',
        }}
      />
    </Style>
  );
}

export default Toolbar;
