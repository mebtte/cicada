import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import Page from '../page';
import RecommendaryMusic from './recommendary_music';
import RecommendaryMusicbill from './recommendary_musicbill';
import RecommendarySinger from './recommendary_singer';

const Style = styled(Page)<{ topBoxShadow: number }>`
  overflow: hidden auto;
  ${scrollbarAsNeeded}

  ${({ topBoxShadow }) => css`
    box-shadow: ${topBoxShadow
      ? 'inset 0px 5px 5px -5px rgb(0 0 0 / 10%)'
      : 'none'};
  `}
`;

const Recommendation = () => {
  const [topBoxShadow, setTopBoxShadow] = useState(0);
  const onScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop } = event.target as HTMLDivElement;
    return setTopBoxShadow(scrollTop === 0 ? 0 : 1);
  };
  return (
    <Style onScroll={onScroll} topBoxShadow={topBoxShadow}>
      <RecommendaryMusic />
      <RecommendaryMusicbill />
      <RecommendarySinger />
    </Style>
  );
};

export default Recommendation;
