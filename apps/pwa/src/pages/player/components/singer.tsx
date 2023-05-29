import styled from 'styled-components';
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
