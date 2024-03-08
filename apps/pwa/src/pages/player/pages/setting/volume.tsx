import { type CSSProperties, memo } from 'react';
import setting from '@/global_states/setting';
import Slider from '@/components/slider';
import theme from '@/global_states/theme';
import { t } from '@/i18n';
import Item from './item';
import { itemStyle } from './constants';

const onVolumnChange = (v: number) =>
  setting.set((s) => ({
    ...s,
    playerVolume: v,
  }));
const sliderStyle: CSSProperties = {
  width: 200,
};
const miniModeSliderStyle: CSSProperties = {
  ...sliderStyle,
  width: 150,
};

function Volume() {
  const { playerVolume } = setting.useState();
  return (
    <Item label={t('relative_volume')} style={itemStyle}>
      <Slider
        current={playerVolume}
        onChange={onVolumnChange}
        style={theme.useState().miniMode ? miniModeSliderStyle : sliderStyle}
      />
    </Item>
  );
}

export default memo(Volume);
