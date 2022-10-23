import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import styled from 'styled-components';
import { Singer } from '../constants';

const Style = styled.div`
  height: 40px;
  padding: 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  background-color: transparent;
  transition: 300ms;

  > .index {
    width: 40px;

    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }

  > .info {
    flex: 1;
    min-width: 0;

    ${ellipsis}

    >.name {
      font-size: 14px;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }

    > .aliases {
      margin-left: 5px;

      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }
  }

  > .time {
    font-family: monospace;
    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }

  &:hover {
    background-color: rgb(0 0 0 / 0.05);
  }
`;

function SingerItem({ singer }: { singer: Singer }) {
  return (
    <Style>
      <div className="index">{singer.index}</div>
      <div className="info">
        <span className="name">{singer.name}</span>
        <span className="aliases">{singer.aliases.join(';')}</span>
      </div>
      <div className="time">{singer.createTime}</div>
    </Style>
  );
}

export default SingerItem;
