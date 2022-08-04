import { memo } from 'react';
import Slider from '@/components/slider';
import playerVolume from '@/global_states/player_volume';
import Item from './item';

const sliderStyle = {
  width: 200,
  padding: '15px 0',
};
const onVolumnChange = (v: number) => playerVolume.set(v);

function Volume() {
  const volume = playerVolume.useState();
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
