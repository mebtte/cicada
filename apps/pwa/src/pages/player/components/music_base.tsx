import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import ellipsis from '@/style/ellipsis';
import { CSS_VAR } from '@/components/theme';
import e, { EventType } from '../eventemitter';
import Singer from './singer';
import { Singer as SingerType } from '../constants';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

const Style = styled.div`
  padding-bottom: 10px;
`;
const Card = styled.div<{ active: boolean }>`
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  min-height: 72px;
  padding: 0 14px 4px;

  display: flex;
  align-items: center;
  gap: 14px;

  position: relative;
  overflow: hidden;

  font-family: ${FONT};
  background: ${({ active }) =>
    active ? 'rgb(232 255 218)' : '#fff'} !important;
  border: 2px solid
    ${({ active }) => (active ? PRIMARY : CSSVariable.COLOR_BORDER)};
  border-radius: 16px;
  box-shadow: 0 4px 0 ${({ active }) =>
    active ? PRIMARY_SHADOW : 'rgb(232 232 232)'};
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out,
    filter 120ms ease-out;

  > .index {
    width: auto;
    height: auto;
    background: transparent;
    border: 0;
    border-radius: 0;
    color: ${({ active }) =>
      active ? PRIMARY : CSSVariable.TEXT_COLOR_SECONDARY};
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 900;
    writing-mode: vertical-lr;
  }

  > .content {
    flex: 1;
    min-width: 0;

    > .music {
      min-height: 68px;

      display: flex;
      align-items: center;
      gap: 14px;

      > .info {
        flex: 1;
        min-width: 0;

        > .top {
          ${ellipsis}
          color: ${CSSVariable.TEXT_COLOR_SECONDARY};

          > .name {
            line-height: 1.5;
            font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
            color: ${({ active }) =>
              active ? 'rgb(58 122 0)' : CSSVariable.TEXT_COLOR_PRIMARY};
            font-weight: 900;
          }

          > .alias {
            font-size: ${CSSVariable.TEXT_SIZE_SMALL};
            font-weight: 700;
          }
        }

        > .singers {
          ${ellipsis}

          font-size: ${CSSVariable.TEXT_SIZE_SMALL};
          font-weight: 700;
          color: ${CSSVariable.TEXT_COLOR_SECONDARY};
        }
      }

      > div:last-child {
        flex: 0 0 auto;
        gap: 8px;

        > button {
          color: ${CSSVariable.TEXT_COLOR_PRIMARY};
          background: #fff;
          border-color: rgb(210 210 210);
          border-radius: 10px;
          box-shadow: 0 3px 0 rgb(185 185 185);
          transition:
            transform 150ms ease-out,
            box-shadow 150ms ease-out,
            filter 120ms ease-out;

          &.primary-action {
            color: #fff;
            background: ${PRIMARY};
            border-color: ${PRIMARY_SHADOW};
            box-shadow: 0 3px 0 ${PRIMARY_SHADOW};
          }

          &:not(:disabled):hover {
            filter: brightness(1.05);
          }

          &:not(:disabled):active {
            transform: translateY(3px);
            box-shadow: none;
            transition:
              transform 60ms ease-in,
              box-shadow 60ms ease-in,
              filter 60ms ease-in;
          }
        }
      }
    }
  }

  &:hover {
    border-color: ${({ active }) => (active ? PRIMARY : 'rgb(198 198 198)')};
    filter: brightness(1.02);
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }

`;

function MusicBase({
  active = false,
  index,
  music,
  lineAfter,
  addon,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  active?: boolean;
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
    <Style {...props}>
      <Card
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
      </Card>
    </Style>
  );
}

export default MusicBase;
