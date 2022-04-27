import styled from 'styled-components';

import ellipsis from '@/style/ellipsis';

export default styled.div`
  height: 46px;
  display: flex;
  gap: 10px;
  align-items: center;
  box-sizing: border-box;
  padding: 0 20px;
  > .index {
    font-size: 12px;
    color: var(--text-color-secondary);
    width: 40px;
  }
  > .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
    > .top {
      display: flex;
      align-items: center;
      gap: 5px;
      > .text {
        ${ellipsis}
        >.name {
          font-size: 14px;
          color: var(--text-color-primary);
          cursor: pointer;
          &:hover {
            color: #000;
          }
        }
        > .alias {
          margin-left: 5px;
          font-size: 12px;
          color: var(--text-color-secondary);
        }
      }
    }
    > .singers {
      ${ellipsis}
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }
  > .actions {
    opacity: 0;
  }
  &:hover {
    background-color: #f9f9f9;
    > .actions {
      opacity: 1;
    }
  }
`;
