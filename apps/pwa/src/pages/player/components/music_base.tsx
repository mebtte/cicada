import { CSSVariable } from '@/global_style';
import styled, { css } from 'styled-components';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import ellipsis from '@/style/ellipsis';
import { MusicWithIndex } from '../constants';
import e, { EventType } from '../eventemitter';
import Singer from './singer';

const Style = styled.div<{ active: boolean }>`
  cursor: pointer;
  user-select: none;
  background-clip: padding-box;
  border-bottom: 2px solid transparent;
  border-left-color: ${CSSVariable.COLOR_PRIMARY};
  border-left-style: solid;
  -webkit-tap-highlight-color: transparent;

  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 20px;

  > .index {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-size: 12px;
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
            font-size: 14px;
            color: ${CSSVariable.TEXT_COLOR_PRIMARY};
          }

          > .alias {
            font-size: 12px;
          }
        }

        > .singers {
          ${ellipsis}

          font-size: 12px;
          color: ${CSSVariable.TEXT_COLOR_SECONDARY};
        }
      }
    }
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE} !important;
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO} !important;
  }

  ${({ active }) => css`
    background-color: ${active
      ? CSSVariable.BACKGROUND_COLOR_LEVEL_ONE
      : 'transparent'};
    border-left-width: ${active ? 5 : 0}px;

    > .index {
      color: ${active
        ? CSSVariable.COLOR_PRIMARY
        : CSSVariable.TEXT_COLOR_SECONDARY};
    }
  `}
`;

function MusicBase({
  active,
  music,
  lineAfter,
  addon,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  active: boolean;
  music: MusicWithIndex;
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
      <div className="index">{music.index}</div>
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
