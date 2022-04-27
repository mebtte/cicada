import React from 'react';
import styled from 'styled-components';
import { animated } from 'react-spring';

import Empty from '@/components/empty';

const Style = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const Wrapper = ({ keyword, style }: { keyword: string; style: unknown }) => (
  <Style style={style}>
    <Empty description={keyword ? '未匹配到音乐' : '空的歌单'} />
  </Style>
);

export default Wrapper;
