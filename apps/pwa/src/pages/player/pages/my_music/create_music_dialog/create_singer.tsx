import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import { createSinger } from '@/pages/player/utils';
import e, { EditDialogType, EventType } from '../../../eventemitter';

const Style = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-decoration: underline;
  cursor: pointer;
`;

function ToCreateSinger() {
  return (
    <Style
      onClick={() =>
        e.emit(EventType.OPEN_EDIT_DIALOG, {
          title: '创建歌手',
          label: '名字',
          type: EditDialogType.INPUT,
          onSubmit: (name: string) => createSinger({ name }),
        })
      }
    >
      找不到歌手?
    </Style>
  );
}

export default ToCreateSinger;
