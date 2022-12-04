import { CSSVariable } from '@/global_style';
import styled, { css } from 'styled-components';
import {
  HtmlHTMLAttributes,
  PointerEventHandler,
  ReactNode,
  useRef,
} from 'react';
import ellipsis from '@/style/ellipsis';
import { MusicWithIndex } from '../constants';
import e, { EventType } from '../eventemitter';
import Singer from './singer';

const LONG_PRESS_DURATION = 500;
const Style = styled.div<{ active: boolean }>`
  cursor: pointer;
  user-select: none;
  border-bottom: 2px solid transparent;
  background-clip: content-box;
  border-left-color: ${CSSVariable.COLOR_PRIMARY};
  border-left-style: solid;

  > .content {
    height: 50px;
    padding: 0 20px;

    display: flex;
    align-items: center;
    gap: 10px;

    > .index {
      width: 35px;

      font-size: 12px;
    }

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

    > .content {
      > .index {
        color: ${active
          ? CSSVariable.COLOR_PRIMARY
          : CSSVariable.TEXT_COLOR_SECONDARY};
      }
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
  const openMusicOperatePopup = () =>
    e.emit(EventType.OPEN_MUSIC_OPERATE_POPUP, { music });

  const openMusicOperatePopupTimerRef = useRef(0);
  const pointerDownTimestamp = useRef(0);
  const cancelPointerUpRef = useRef(false);

  const cancelPointerDownAndUp = () => {
    window.clearTimeout(openMusicOperatePopupTimerRef.current);

    cancelPointerUpRef.current = true;
    window.setTimeout(() => {
      cancelPointerUpRef.current = false;
    }, 500);
  };
  const onPointerDown: PointerEventHandler<HTMLDivElement> = () => {
    openMusicOperatePopupTimerRef.current = window.setTimeout(
      openMusicOperatePopup,
      LONG_PRESS_DURATION,
    );
    pointerDownTimestamp.current = Date.now();
  };
  const onPointerMove: PointerEventHandler<HTMLDivElement> = () => {
    if (pointerDownTimestamp.current) {
      cancelPointerDownAndUp();
    }
  };
  const onPointerUp: PointerEventHandler<HTMLDivElement> = () => {
    window.clearTimeout(openMusicOperatePopupTimerRef.current);
    if (
      !cancelPointerUpRef.current &&
      Date.now() - pointerDownTimestamp.current < LONG_PRESS_DURATION
    ) {
      e.emit(EventType.OPEN_MUSIC_DRAWER, { id: music.id });
    }

    pointerDownTimestamp.current = 0;
  };

  return (
    <Style
      {...props}
      active={active}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(event) => {
        event.preventDefault();
        openMusicOperatePopup();

        cancelPointerDownAndUp();
      }}
    >
      <div className="content">
        <div className="index">{music.index}</div>
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
    </Style>
  );
}

export default MusicBase;
