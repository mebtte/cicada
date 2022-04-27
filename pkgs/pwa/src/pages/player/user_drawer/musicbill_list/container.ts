import styled from 'styled-components';

import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import ellipsis from '@/style/ellipsis';

export default styled.div`
  flex: 1;
  min-height: 0;

  overflow: auto;
  ${scrollbarAsNeeded}

  padding: 0 10px 10px 10px;
  font-size: 0;

  > .musicbill {
    display: inline-block;
    margin: 10px;

    > .name {
      margin-top: 3px;

      cursor: pointer;
      font-size: 14px;
      color: var(--text-color-primary);
      ${ellipsis}

      &:hover {
        color: #000;
      }
    }
  }
`;
