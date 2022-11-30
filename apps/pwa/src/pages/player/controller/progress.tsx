import { CSSVariable } from '#/global_style';
import { PointerEventHandler, useRef, useState } from 'react';
import styled from 'styled-components';
import classnames from 'classnames';
import { IS_TOUCHABLE } from '@/constants';
import { flexCenter } from '#/style/flexbox';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const THUMB_SIZE = 24;
const Style = styled.div`
  z-index: 1;

  position: relative;

  height: 5px;

  cursor: pointer;
  background-color: rgb(44 182 145 / 0.3);
  transform-origin: bottom;
  transition: 100ms;
  user-select: none;

  > .current {
    height: 100%;

    background-color: ${CSSVariable.COLOR_PRIMARY};
    transform-origin: left;
  }

  > .thumb {
    position: absolute;
    top: calc(50% - ${THUMB_SIZE / 2}px);
    width: ${THUMB_SIZE}px;
    height: ${THUMB_SIZE}px;

    transform: translateX(-50%);

    ${flexCenter}

    >.inner {
      width: 50%;
      height: 50%;
      background-color: ${CSSVariable.COLOR_PRIMARY};
    }
  }

  &.untouchable {
    &:hover {
      transform: scaleY(3);
    }
  }
`;

function Progress({ duration }: { duration: number }) {
  const [innerPercent, setInnerPercent] = useState(0);
  const pointerDownRef = useRef(false);

  const onPointerDown: PointerEventHandler<HTMLDivElement> = (e) => {
    (e.target as HTMLDivElement).setPointerCapture(e.pointerId);

    pointerDownRef.current = true;

    const percent = e.pageX / window.innerWidth;
    setInnerPercent(percent);
  };
  const onPointerUp: PointerEventHandler<HTMLDivElement> = (e) => {
    pointerDownRef.current = false;

    const percent = e.pageX / window.innerWidth;
    playerEventemitter.emit(PlayerEventType.ACTION_SET_TIME, {
      second: duration * percent,
    });

    window.setTimeout(() => setInnerPercent(0), 0);
  };
  const onPointerMove: PointerEventHandler<HTMLDivElement> = (e) => {
    if (pointerDownRef.current) {
      const percent = e.pageX / window.innerWidth;
      setInnerPercent(percent);
    }
  };

  const currentMillisecond = useAudioCurrentMillisecond();
  const percent = duration ? currentMillisecond / 1000 / duration : 0;

  const actualPercent = innerPercent || percent;
  return (
    <Style
      className={classnames({
        touchable: IS_TOUCHABLE,
        untouchable: !IS_TOUCHABLE,
      })}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    >
      <div
        className="current"
        style={{
          transform: `scaleX(${actualPercent})`,
        }}
      />
      {IS_TOUCHABLE ? (
        <div
          className="thumb"
          style={{
            left: `${actualPercent * 100}%`,
          }}
        >
          <div className="inner" />
        </div>
      ) : null}
    </Style>
  );
}

export default Progress;
