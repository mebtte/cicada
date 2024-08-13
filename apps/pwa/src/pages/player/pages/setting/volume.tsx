import { type CSSProperties, memo } from 'react';
import Slider from '@/components/slider';
import { useTheme } from '@/global_states/theme';
import { t } from '@/i18n';
import Item from './item';
import { itemStyle } from './constants';
import { useSetting } from '@/global_states/setting';

const onVolumnChange = (v: number) =>
  useSetting.setState({
    playerVolume: v,
  });
const sliderStyle: CSSProperties = {
  width: 200,
};
const miniModeSliderStyle: CSSProperties = {
  ...sliderStyle,
  width: 150,
};

function Volume() {
  const { playerVolume } = useSetting();
  return (
    <Item label={t('relative_volume')} style={itemStyle}>
      <Slider
        current={playerVolume}
        onChange={onVolumnChange}
        style={useTheme().miniMode ? miniModeSliderStyle : sliderStyle}
      />
    </Item>
  );
}

export default memo(Volume);
