import styled from 'styled-components';

import ellipsis from '@/style/ellipsis';

export default styled.div`
  padding: 10px 20px;

  display: flex;
  align-items: center;
  gap: 20px;

  > .info {
    position: relative;

    flex: 1;
    min-width: 0;

    display: flex;
    flex-direction: column;
    gap: 15px;

    > .name {
      font-size: 24px;
      font-weight: bold;
      color: var(--text-color-primary);
      ${ellipsis}
    }

    > .user {
      display: flex;
      align-items: center;
      gap: 10px;
      > .name {
        flex: 1;
        ${ellipsis}

        font-size: 16px;
        color: var(--text-color-primary);
      }
    }

    > .description {
      font-size: 14px;
      color: var(--text-color-secondary);
      ${ellipsis}
    }
  }
`;
