import { PointerEventHandler, memo, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  StopTimerPosition,
  StopTimer as StopTimerType,
  ZIndex,
} from '../constants';
import Content from './content';

const Style = styled.div`
  z-index: ${ZIndex.STOP_TIMER};
  position: absolute;

  cursor: grab;
`;
const DEFAULT_POSITION: StopTimerPosition = {
  direction: 'right',
  top: 100,
} as const;
interface DraggingPosition {
  top: number;
  left: number;
}
interface DraggingInfo {
  offsetX: number;
  offsetY: number;
}

function StopTimer({ stopTimer }: { stopTimer: StopTimerType }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<StopTimerPosition>(DEFAULT_POSITION);
  const [draggingPosition, setDraggingPosition] = useState<DraggingPosition>({
    top: 0,
    left: 0,
  });
  const [dragging, setDragging] = useState(false);
  const draggingInfoRef = useRef<DraggingInfo>({ offsetX: 0, offsetY: 0 });
  const onPointerDown: PointerEventHandler<HTMLDivElement> = (e) => {
    (e.target as HTMLDivElement).setPointerCapture(e.pointerId);

    const { pageX, pageY } = e;

    const { top, left } = ref.current!.getBoundingClientRect();
    draggingInfoRef.current = {
      offsetX: pageX - left,
      offsetY: pageY - top,
    };

    setDraggingPosition({
      top: pageY - draggingInfoRef.current.offsetY,
      left: pageX - draggingInfoRef.current.offsetX,
    });
    setDragging(true);
  };
  const onPointerMove: PointerEventHandler<HTMLDivElement> = (e) => {
    if (dragging) {
      const { pageX, pageY } = e;
      setDraggingPosition({
        top: pageY - draggingInfoRef.current.offsetY,
        left: pageX - draggingInfoRef.current.offsetX,
      });
    }
  };
  const onPointerUp: PointerEventHandler<HTMLDivElement> = (e) => {
    const { pageX, pageY } = e;
    const { offsetY } = draggingInfoRef.current;
    const { innerWidth, innerHeight } = window;
    const top = pageY - offsetY;
    setPosition({
      direction: pageX > innerWidth / 2 ? 'right' : 'left',
      top: Math.min(Math.max(top, 0), innerHeight - ref.current!.clientHeight),
    });
    globalThis.setTimeout(() => setDragging(false));
  };

  useEffect(() => {
    const onWindowResize = () => {
      const { innerHeight } = window;
      return setPosition((p) => ({
        ...p,
        top: Math.min(
          Math.max(p.top, 0),
          innerHeight - ref.current!.clientHeight,
        ),
      }));
    };
    window.addEventListener('resize', onWindowResize);
    return () => window.removeEventListener('resize', onWindowResize);
  }, []);

  return (
    <Style
      ref={ref}
      style={
        dragging
          ? draggingPosition
          : {
              [position.direction]: 0,
              top: position.top,
            }
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <Content
        dragging={dragging}
        direction={position.direction}
        stopTimer={stopTimer}
      />
    </Style>
  );
}

export default memo(StopTimer);
