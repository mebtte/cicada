import { memo } from 'react';
import Slider from '@/components/slider';
import setting from '@/global_states/setting';
import Item from './item';

const sliderStyle = {
  width: 200,
  padding: '15px 0',
};
const onVolumnChange = (v: number) =>
  setting.set((s) => ({
    ...s,
    playerVolume: v,
  }));

function Volume() {
  const { playerVolume } = setting.useState();
  return (
    <Item>
      <div className="label">相对系统音量</div>
      <Slider
        value={playerVolume}
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
