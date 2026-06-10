import { MouseEvent } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';

export interface SingerValue {
  id: string;
  name: string;
}

export interface SingerProps {
  onOpen?: (singer: SingerValue, event: MouseEvent<HTMLSpanElement>) => void;
  singer: SingerValue;
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

function Singer({ onOpen, singer }: SingerProps) {
  return (
    <Style>
      <span
        className="name"
        onClick={(event) => {
          event.stopPropagation();
          onOpen?.(singer, event);
        }}
      >
        {singer.name}
      </span>
      <span className="divider">&nbsp;|&nbsp;</span>
    </Style>
  );
}

export default Singer;
