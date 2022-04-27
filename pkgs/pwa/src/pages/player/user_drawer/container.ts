import { animated } from 'react-spring';
import styled from 'styled-components';

import ellipsis from '@/style/ellipsis';
import { containerStyle } from './constants';

export default styled(animated.div)`
  ${containerStyle}

  display: flex;
  flex-direction: column;
  gap: 20px;

  > .top {
    padding: 20px 20px 0 20px;

    display: flex;
    align-items: center;
    gap: 20px;

    > .info {
      flex: 1;
      min-width: 0;

      > .name {
        font-size: 24px;
        color: var(--text-color-primary);
        font-weight: bold;
        ${ellipsis}
      }

      > .join-time {
        margin-top: 5px;

        font-size: 14px;
        color: var(--text-color-secondary);
      }

      > .condition {
        margin-top: 15px;

        font-size: 14px;
        color: var(--text-color-secondary);

        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }
`;
