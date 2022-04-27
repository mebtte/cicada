import React from 'react';
import styled from 'styled-components';
import Slider from 'react-slider';

const TRACK_HEIGHT = 2;
const THUMB_SIZE = 14;

const Style = styled.div`
  height: ${TRACK_HEIGHT}px;
  .thumb {
    margin-top: ${TRACK_HEIGHT / 2}px;
    width: ${THUMB_SIZE}px;
    height: ${THUMB_SIZE}px;
    transform: translate(0, -50%);
    cursor: grab;
    outline: none;
    box-sizing: border-box;
    border-radius: 50%;
    background-color: #fff;
    border: 2px solid rgb(49 194 124);
  }
`;
const Track = styled.div<{
  primary: boolean;
}>`
  height: ${TRACK_HEIGHT}px;
  border-radius: ${TRACK_HEIGHT / 2}px;
  cursor: pointer;
  &.track-0 {
    background-color: rgb(49 194 124 / 0.5);
  }
  &.track-1 {
    background-color: rgb(0 0 0 / 0.05);
  }
`;

/**
 * 滑块
 * @author mebtte<hi@mebtte.com>
 */
const Wrapper = ({
  value,
  onChange,
  step = 0.01,
  min = 0,
  max = 1,
  ...props
}: {
  /** 值 */
  value: number;
  /** 值变化回调 */
  onChange: (value: number) => void;
  /** 滑动变化值 */
  step?: number;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  [key: string]: any;
}) => {
  const renderTrack = (p, s) => <Track {...p} primary={s.index === 0} />;
  const renderThumb = (p) => <div {...p} className="thumb" />;

  return (
    <Style {...props}>
      <Slider
        value={value}
        onChange={onChange}
        step={step}
        min={min}
        max={max}
        renderTrack={renderTrack}
        renderThumb={renderThumb}
      />
    </Style>
  );
};

export default Wrapper;
