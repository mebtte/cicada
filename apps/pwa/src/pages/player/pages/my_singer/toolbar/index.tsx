import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdAdd } from 'react-icons/md';
import Filter from './filter';
import { TOOLBAR_HEIGHT } from '../constants';
import Question from './question';
import playerEventemitter, {
  EditDialogType,
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { createSinger } from '../../../utils';
import e, { EventType } from '../eventemitter';

const Style = styled.div`
  position: absolute;
  width: 100%;
  height: ${TOOLBAR_HEIGHT}px;
  left: 0;
  bottom: 0;

  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;

  backdrop-filter: blur(5px);
`;

function Toolbar() {
  const onCreateSinger = () =>
    playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
      title: '创建歌手',
      label: '名字',
      type: EditDialogType.INPUT,
      onSubmit: async (name: string) =>
        createSinger({
          name,
          callback: () => e.emit(EventType.RELOAD_SINGER_LIST, null),
        }),
    });
  return (
    <Style>
      <IconButton onClick={onCreateSinger}>
        <MdAdd />
      </IconButton>
      <Question />
      <Filter />
    </Style>
  );
}

export default Toolbar;
