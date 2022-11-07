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

  &.music-count {
    font-family: monospace;
  }
`;
const Secondary = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  ${ellipsis}

  &.time {
    font-family: monospace;
  }
`;

function SingerItem({ singer }: { singer: Singer }) {
  const openSingerDrawer = () =>
    e.emit(EventType.OPEN_SINGER_DRAWER, { id: singer.id });
  return (
    <StyledRow
      onClick={openSingerDrawer}
      onContextMenu={(event) => {
        event.preventDefault();
        return openSingerDrawer();
      }}
      one={<Secondary>{singer.index}</Secondary>}
      two={
        <div>
          <Primary>{singer.name}</Primary>
          {singer.aliases.length ? (
            <Secondary>
              {`${singer.aliases[0]}${singer.aliases.length > 1 ? '...' : ''}`}
            </Secondary>
          ) : null}
        </div>
      }
      three={<Primary className="music-count">{singer.musicCount}</Primary>}
      four={<Secondary className="time">{singer.createTime}</Secondary>}
    />
  );
}

export default SingerItem;
