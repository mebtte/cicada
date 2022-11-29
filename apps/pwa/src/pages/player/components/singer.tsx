import styled from 'styled-components';
import { Singer as SingerType } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.span`
  user-select: none;

  > .name {
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  &:last-child {
    > .divider {
      display: none;
    }
  }
`;

function Singer({ singer }: { singer: SingerType }) {
  return (
    <Style>
      <span
        className="name"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => {
          e.stopPropagation();
          return playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, {
            id: singer.id,
          });
        }}
      >
        {singer.name}
      </span>
      <span className="divider">&nbsp;|&nbsp;</span>
    </Style>
  );
}

export default Singer;
