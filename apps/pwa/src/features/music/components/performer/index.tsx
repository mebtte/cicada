import { MouseEvent } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';

export interface ArtistValue {
  id: string;
  name: string;
}

export interface ArtistProps {
  onOpen?: (performer: ArtistValue, event: MouseEvent<HTMLSpanElement>) => void;
  performer: ArtistValue;
}

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

function Performer({ onOpen, performer }: ArtistProps) {
  return (
    <Style>
      <span
        className="name"
        onClick={(event) => {
          event.stopPropagation();
          onOpen?.(performer, event);
        }}
      >
        {performer.name}
      </span>
      <span className="divider">&nbsp;|&nbsp;</span>
    </Style>
  );
}

export default Performer;
