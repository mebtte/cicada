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

const Style = styled.span<{ $clickable: boolean }>`
  user-select: none;

  > .name {
    transition: color 120ms ease-out;

    ${({ $clickable }) =>
      $clickable
        ? `
          cursor: pointer;

          &:hover {
            color: ${CSSVariable.TEXT_COLOR_PRIMARY};
          }
        `
        : ''}
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
  const clickable = !!onOpen;

  return (
    <Style $clickable={clickable}>
      <span
        className="name"
        onClick={(event) => {
          if (!onOpen) {
            return;
          }

          // Artist 标签处于可点击音乐卡片内部时, 需要阻止冒泡避免同时打开 music drawer。
          event.stopPropagation();
          onOpen(performer, event);
        }}
      >
        {performer.name}
      </span>
      <span className="divider">&nbsp;|&nbsp;</span>
    </Style>
  );
}

export default Performer;
