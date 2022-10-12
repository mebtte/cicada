import { useState } from 'react';
import * as React from 'react';
import styled, { css } from 'styled-components';
import Page from '../page';

const Style = styled(Page)<{ topBoxShadow: number }>`
  overflow: auto;

  ${({ topBoxShadow }) => css`
    box-shadow: ${topBoxShadow
      ? 'inset 0px 5px 5px -5px rgb(0 0 0 / 10%)'
      : 'none'};
  `}
`;

function ScrollablePage({ children, ...props }: React.PropsWithChildren<{}>) {
  const [topBoxShadow, setTopBoxShadow] = useState(0);
  const onScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop } = event.target as HTMLDivElement;
    return setTopBoxShadow(scrollTop === 0 ? 0 : 1);
  };
  return (
    <Style {...props} onScroll={onScroll} topBoxShadow={topBoxShadow}>
      {children}
    </Style>
  );
}

export default ScrollablePage;
