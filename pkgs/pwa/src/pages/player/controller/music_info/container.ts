import styled from 'styled-components';
import { animated } from 'react-spring';

import ellipsis from '@/style/ellipsis';
import { MUSIC_NAME_SIZE } from './constant';

export default styled(animated.div)`
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  display: flex;
  gap: 10px;
  align-items: center;
  > .text {
    color: rgb(222 222 222);
    ${ellipsis}
    > .name {
      font-size: ${MUSIC_NAME_SIZE}px;
      cursor: pointer;
      color: rgb(55 55 55);
      &:hover {
        color: rgb(0 0 0);
      }
    }
    > .singers {
      margin-left: 5px;
      font-size: 12px;
    }
  }
`;
