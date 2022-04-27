import { useTransition } from '@react-spring/core';
import React from 'react';
import styled from 'styled-components';

import { TopContent } from '../constants';
import useTopContent from './use_top_content';
import Search from './search';
import MusicbillInfo from './musicbill_info';
import { Musicbill } from '../../../constants';

const Style = styled.div`
  position: relative;
  height: 90px;
`;

const Wrapper = ({ musicbill }: { musicbill: Musicbill }) => {
  const topContent = useTopContent();
  const transitions = useTransition(topContent, {
    from: { transform: 'translateY(-100%)', opacity: 0 },
    enter: { transform: 'translateY(0%)', opacity: 1 },
    leave: { transform: 'translateY(100%)', opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, tc) => {
        if (tc === TopContent.INFO) {
          return <MusicbillInfo musicbill={musicbill} style={style} />;
        }
        if (tc === TopContent.SEARCH) {
          return <Search cover={musicbill.cover} style={style} />;
        }
        return null;
      })}
    </Style>
  );
};

export default Wrapper;
