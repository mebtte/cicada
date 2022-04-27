import React from 'react';
import styled from 'styled-components';

import Empty from '@/components/empty';
import Container from '../container';

const Style = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Wrapper = () => (
  <Style>
    <Empty description="空的播放队列" />
  </Style>
);

export default React.memo(Wrapper);
