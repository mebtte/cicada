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

function Wrapper({ keyword, style }: { keyword: string; style: unknown }) {
  return (
    <Style style={style}>
      <Empty description={keyword ? '未匹配到音乐' : '空的乐单'} />
    </Style>
  );
}

export default Wrapper;
