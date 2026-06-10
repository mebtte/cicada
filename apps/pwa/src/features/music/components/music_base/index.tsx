import { HTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { CSS_VAR } from '@/components/theme';
import Singer, { type SingerValue } from '../singer';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

export interface MusicBaseValue {
  aliases: string[];
  id: string;
  name: string;
  singers: SingerValue[];
}

export interface MusicBaseProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  addon?: ReactNode;
  index: number;
  lineAfter: ReactNode;
  music: MusicBaseValue;
  onOpenMusic?: (music: MusicBaseValue) => void;
  onOpenSinger?: (singer: SingerValue) => void;
}

const Style = styled.div`
  padding-top: 4px;
  padding-bottom: 6px;
`;
const Card = styled.div<{ $active: boolean; $clickable: boolean }>`
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
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
  background: ${({ $active }) =>
    $active ? 'rgb(232 255 218)' : '#fff'} !important;
  border: 2px solid
    ${({ $active }) => ($active ? PRIMARY : CSSVariable.COLOR_BORDER)};
  border-radius: 16px;
  box-shadow: 0 4px 0 ${({ $active }) =>
    $active ? PRIMARY_SHADOW : CSSVariable.COLOR_SURFACE_SHADOW};
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
    color: ${({ $active }) =>
      $active ? PRIMARY : CSSVariable.TEXT_COLOR_SECONDARY};
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
            color: ${({ $active }) =>
              $active ? 'rgb(58 122 0)' : CSSVariable.TEXT_COLOR_PRIMARY};
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
          border-color: ${CSSVariable.COLOR_CONTROL_NEUTRAL};
          border-radius: 10px;
          box-shadow: 0 3px 0 ${CSSVariable.COLOR_CONTROL_NEUTRAL};
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
            transform: translateY(-2px);
            box-shadow: 0 5px 0 ${CSSVariable.COLOR_CONTROL_NEUTRAL};
            filter: brightness(1.05);
          }

          &.primary-action:not(:disabled):hover {
            box-shadow: 0 5px 0 ${PRIMARY_SHADOW};
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
    transform: translateY(-2px);
    box-shadow: 0 6px 0
      ${({ $active }) =>
        $active ? PRIMARY_SHADOW : CSSVariable.COLOR_SURFACE_SHADOW};
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
  addon,
  index,
  lineAfter,
  music,
  onOpenMusic,
  onOpenSinger,
  ...props
}: MusicBaseProps) {
  return (
    <Style {...props}>
      <Card
        $active={active}
        $clickable={!!onOpenMusic}
        onClick={() => onOpenMusic?.(music)}
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
                  <Singer
                    key={singer.id}
                    singer={singer}
                    onOpen={onOpenSinger}
                  />
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
