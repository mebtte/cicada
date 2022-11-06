import { CSSVariable } from '#/global_style';
import styled from 'styled-components';
import ellipsis from '#/style/ellipsis';
import { Singer } from '../constants';
import e, { EventType } from '../../../eventemitter';
import Row from './row';

const StyledRow = styled(Row)`
  cursor: pointer;
  transition: 300ms;

  &:hover {
    background-color: rgb(0 0 0 / 0.05);
  }

  &:active {
    background-color: rgb(0 0 0 / 0.1);
  }
`;
const Primary = styled.div`
  font-size: 14px;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  ${ellipsis}
`;
const Secondary = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  ${ellipsis}
`;

function SingerItem({ singer }: { singer: Singer }) {
  return (
    <StyledRow
      onClick={() => e.emit(EventType.OPEN_SINGER_DRAWER, { id: singer.id })}
      one={<Secondary>{singer.index}</Secondary>}
      two={<Primary>{singer.name}</Primary>}
      three={<Secondary>{singer.aliases.join('; ') || '-'}</Secondary>}
      four={<Primary>{singer.musicCount}</Primary>}
      five={<Secondary>{singer.createTime}</Secondary>}
    />
  );
}

export default SingerItem;
