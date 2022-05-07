import styled, { css } from 'styled-components';

import scrollbarAsNeeded from '@/style/scrollbar_as_needed';

export const Container = styled.div<{ topBoxShadow: number }>`
  flex: 1;
  min-width: 0;

  overflow: auto;
  ${scrollbarAsNeeded}

  ${({ topBoxShadow }) => css`
    box-shadow: ${topBoxShadow
      ? 'inset 0px 5px 5px -5px rgb(0 0 0 / 10%)'
      : 'none'};
  `}
`;
