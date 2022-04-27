import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import scrollbarNever from '@/style/scrollbar_never';
import { MusicbillListContainer } from './constants';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Style = styled(({ topBoxShadow, ...props }: any) => (
  <MusicbillListContainer {...props} />
))<{
  topBoxShadow: number;
}>`
  overflow: auto;
  ${scrollbarNever}

  ${({ topBoxShadow }) => css`
    box-shadow: ${topBoxShadow
      ? 'inset 0px 5px 5px -5px rgb(0 0 0 / 40%)'
      : 'none'};
  `}
`;

const MusicbillList = ({
  style,
  children,
}: React.PropsWithChildren<{
  style: unknown;
}>) => {
  const [topBoxShadow, setTopBoxShadow] = useState(0);
  const onScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop } = event.target as HTMLDivElement;
    return setTopBoxShadow(scrollTop === 0 ? 0 : 1);
  };
  return (
    <Style topBoxShadow={topBoxShadow} onScroll={onScroll} style={style}>
      {children}
    </Style>
  );
};

export default MusicbillList;
