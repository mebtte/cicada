import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { memo } from 'react';
import styled from 'styled-components';

const Style = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;

  -webkit-app-region: drag;
`;

function AppRegion() {
  const { height } = useTitlebarArea();
  return height === 0 ? null : <Style style={{ height }} />;
}

export default memo(AppRegion);
