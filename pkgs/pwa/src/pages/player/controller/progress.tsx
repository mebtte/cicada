import React, { useContext, useMemo } from 'react';
import styled from 'styled-components';

import Slider from '@/components/slider';
import formatSecond from '@/utils/format_second';
import eventemitter, { EventType } from '../eventemitter';
import Context from '../context';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';

const Style = styled.div`
  display: flex;
  align-items: center;
  > .time {
    line-height: 1;
    font-size: 12px;
    width: 80px;
    text-align: right;
    transform-origin: right;
    transform: scale(0.9);
    color: rgb(155 155 155);
    > span {
      vertical-align: middle;
    }
    > .symbol {
      display: inline-block;
      margin: 0 5px;
      width: 1px;
      height: 14px;
      background-color: var(--text-color-secondary);
    }
  }
`;
const sliderStyle = {
  flex: 1,
  minWidth: 0,
};

const Progress = () => {
  const { audioDuration } = useContext(Context);
  const durationString = useMemo(
    () => formatSecond(audioDuration),
    [audioDuration],
  );

  const currentMillisecond = useAudioCurrentMillisecond();
  const setTime = (p: number) => {
    if (!audioDuration) {
      return eventemitter.emit(EventType.ACTION_SET_TIME, { second: 0 });
    }
    return eventemitter.emit(EventType.ACTION_SET_TIME, {
      second: audioDuration * p,
    });
  };

  const percent = audioDuration ? currentMillisecond / 1000 / audioDuration : 0;
  return (
    <Style>
      <Slider
        style={sliderStyle}
        value={percent}
        onChange={setTime}
        min={0}
        max={1}
        step={0.005}
      />
      <div className="time">
        <span>{formatSecond(currentMillisecond / 1000)}</span>
        <span className="symbol" />
        <span>{durationString}</span>
      </div>
    </Style>
  );
};

export default React.memo(Progress);
