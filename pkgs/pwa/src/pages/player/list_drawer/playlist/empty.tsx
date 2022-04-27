import React from 'react';
import styled from 'styled-components';

import Empty from '@/components/empty';

const Style = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Wrapper = ({ keyword }: { keyword: string }) => (
  <Style>
    <Empty
      description={keyword ? `没有"${keyword}"相关的音乐` : '空的播放列表'}
    />
  </Style>
);

export default Wrapper;
