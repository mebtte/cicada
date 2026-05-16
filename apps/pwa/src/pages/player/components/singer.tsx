import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.span`
  user-select: none;

  > .name {
    cursor: pointer;
    transition: color 120ms ease-out;

    &:hover {
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }
  }

  > .divider {
    opacity: 0.5;
  }

  &:last-child {
    > .divider {
      display: none;
    }
  }
`;

function Singer({ singer }: { singer: { id: string; name: string } }) {
  return (
    <Style>
      <span
        className="name"
        onClick={(event) => {
          event.stopPropagation();
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
