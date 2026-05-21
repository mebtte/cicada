import { useCallback, useEffect, useRef, useState } from 'react';
import playerEventemitter, { EventType as PlayerEventType } from './eventemitter';

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 1);

function useProgressSeek({
  duration,
  currentMillisecond,
}: {
  duration: number;
  currentMillisecond: number;
}) {
  const [dragPercent, setDragPercent] = useState<number | null>(null);
  const clearDragPercentTimerRef = useRef<number | null>(null);
  const currentPercent = duration
    ? clampPercent(currentMillisecond / 1000 / duration)
    : 0;
  const displayPercent = dragPercent ?? currentPercent;

  const clearDragPercentTimer = useCallback(() => {
    if (clearDragPercentTimerRef.current !== null) {
      window.clearTimeout(clearDragPercentTimerRef.current);
      clearDragPercentTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setDragPercent(null);
    clearDragPercentTimer();
  }, [clearDragPercentTimer, duration]);

  useEffect(
    () => () => {
      clearDragPercentTimer();
    },
    [clearDragPercentTimer],
  );

  const onChange = useCallback(
    (percent: number) => {
      if (!duration) return;
      setDragPercent(clampPercent(percent));
    },
    [duration],
  );

  const onCommit = useCallback(
    (percent: number) => {
      if (!duration) {
        setDragPercent(null);
        return;
      }

      const nextPercent = clampPercent(percent);
      setDragPercent(nextPercent);
      // 拖拽期间只预览进度, 松手后才 seek 一次, 避免连续设置 currentTime 导致卡顿和跳播.
      playerEventemitter.emit(PlayerEventType.ACTION_SET_TIME, {
        second: duration * nextPercent,
      });

      clearDragPercentTimer();
      clearDragPercentTimerRef.current = window.setTimeout(() => {
        setDragPercent(null);
        clearDragPercentTimerRef.current = null;
      }, 0);
    },
    [clearDragPercentTimer, duration],
  );

  return {
    displayMillisecond: displayPercent * duration * 1000,
    displayPercent,
    onChange,
    onCommit,
  };
}

export default useProgressSeek;
