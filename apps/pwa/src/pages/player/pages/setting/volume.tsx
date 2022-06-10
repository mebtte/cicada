import { memo } from 'react';
import Slider from '@/components/slider';
import volumeState from '../../share_states/volume';
import Item from './item';

const sliderStyle = {
  width: 200,
  padding: '15px 0',
};
const onVolumnChange = (v: number) => volumeState.set(v);

function Volume() {
  const volume = volumeState.useState();
  return (
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
}

export default memo(Volume);
