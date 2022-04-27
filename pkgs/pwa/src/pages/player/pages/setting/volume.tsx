import React from 'react';

import Slider from '@/components/slider';
import Item from './item';
import eventemiter, { EventType } from '../../eventemitter';

const sliderStyle = {
  width: 200,
  padding: '15px 0',
};
const onVolumnChange = (v: number) =>
  eventemiter.emit(EventType.ACTION_UPDATE_VOLUME, v);

const Volume = ({ volume }: { volume: number }) => (
  <Item>
    <div className="label">相对系统音量</div>
    <Slider
      value={volume}
      onChange={onVolumnChange}
      step={0.01}
      min={0}
      max={1}
      style={sliderStyle}
    />
  </Item>
);

export default React.memo(Volume);
