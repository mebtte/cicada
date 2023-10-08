import { CSSVariable } from '@/global_style';
import styled, { css } from 'styled-components';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import ellipsis from '@/style/ellipsis';
import e, { EventType } from '../eventemitter';
import Singer from './singer';
import { Singer as SingerType } from '../constants';

const Style = styled.div<{ active: boolean }>`
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 20px;

  > .index {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    writing-mode: vertical-lr;
    font-family: monospace;
  }

  > .content {
    flex: 1;
    min-width: 0;

    > .music {
      height: 50px;

      display: flex;
      align-items: center;
      gap: 10px;

      > .info {
        flex: 1;
        min-width: 0;

        > .top {
          ${ellipsis}
          color: ${CSSVariable.TEXT_COLOR_SECONDARY};

          > .name {
            line-height: 1.5;
            font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
            color: ${CSSVariable.TEXT_COLOR_PRIMARY};
          }

          > .alias {
            font-size: ${CSSVariable.TEXT_SIZE_SMALL};
          }
        }

        > .singers {
          ${ellipsis}

          font-size: ${CSSVariable.TEXT_SIZE_SMALL};
          color: ${CSSVariable.TEXT_COLOR_SECONDARY};
        }
      }
    }
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }

  ${({ active }) => css`
    background-color: ${active
      ? `${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO} !important`
      : 'transparent'};

    > .index {
      color: ${active
        ? CSSVariable.COLOR_PRIMARY
        : CSSVariable.TEXT_COLOR_SECONDARY};
    }
  `}
`;

function MusicBase({
  active,
  index,
  music,
  lineAfter,
  addon,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  active: boolean;
  index: number;
  music: {
    id: string;
    name: string;
    singers: SingerType[];
    aliases: string[];
  };
  lineAfter: ReactNode;
  addon?: ReactNode;
}) {
  const openMusicDrawer = () =>
    e.emit(EventType.OPEN_MUSIC_DRAWER, { id: music.id });
  return (
    <Style
      {...props}
      active={active}
      onClick={openMusicDrawer}
      onContextMenu={(event) => {
        event.preventDefault();
        return openMusicDrawer();
      }}
    >
      <div className="index">{index}</div>
      <div className="content">
        <div className="music">
          <div className="info">
            <div className="top">
              <span className="name">{music.name}</span>
              {music.aliases.length ? (
                <span className="alias">&nbsp;{music.aliases[0]}</span>
              ) : null}
            </div>
            <div className="singers">
              {music.singers.map((singer) => (
                <Singer key={singer.id} singer={singer} />
              ))}
            </div>
          </div>
          {lineAfter}
        </div>
        {addon}
      </div>
    </Style>
  );
}

export default MusicBase;
