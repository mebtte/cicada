import { CSSVariable } from '#/global_style';
import { PointerEventHandler, useRef, useState } from 'react';
import styled from 'styled-components';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.div`
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

  &:hover {
    transform: scaleY(3);
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
    playerEventemitter.emit(PlayerEventType.AUDIO_TIME_UPDATED, {
      currentMillisecond: duration * percent * 1000,
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
  return (
    <Style
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    >
      <div
        className="current"
        style={{
          transform: `scaleX(${innerPercent || percent})`,
        }}
      />
    </Style>
  );
}

export default Progress;
