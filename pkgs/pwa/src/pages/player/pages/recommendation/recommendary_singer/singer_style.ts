import styled from 'styled-components';

import ellipsis from '@/style/ellipsis';
import { COVER_SIZE } from '../constants';

export default styled.div`
  width: ${COVER_SIZE}px;

  > .name {
    margin: 5px 0 0 0;

    font-size: 14px;
    line-height: 1.3;

    cursor: pointer;
    color: var(--text-color-primary);
    ${ellipsis}

    &:hover {
      color: #000;
    }
  }
`;
