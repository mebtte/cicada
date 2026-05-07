import { memo } from 'react';
import { Slider } from '@/components';
import { t } from '@/i18n';
import styled, { css } from 'styled-components';
import Item from './item';
import { itemStyle } from './constants';
import { useSetting } from '@/global_states/setting';

const Control = styled.div`
  width: 280px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;

  ${({ theme: { miniMode } }) =>
    miniMode &&
    css`
      width: 100%;
    `}
`;

const StyledSlider = styled(Slider)`
  width: 100%;
  min-width: 0;
`;

const onVolumeChange = (v: number) =>
  useSetting.setState({
    playerVolume: v,
  });

function Volume() {
  const { playerVolume } = useSetting();
  return (
    <Item label={t('relative_volume')} style={itemStyle}>
      <Control>
        <StyledSlider
          value={playerVolume}
          onChange={onVolumeChange}
          alwaysShowThumb
        />
      </Control>
    </Item>
  );
}

export default memo(Volume);
