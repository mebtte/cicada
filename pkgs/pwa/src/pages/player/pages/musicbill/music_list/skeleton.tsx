import React, { useMemo } from 'react';
import { animated } from 'react-spring';
import styled from 'styled-components';

import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import getRandomInteger from '@/utils/get_random_integer';
import { Skeleton } from '../../../components/music';

const Style = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  ${scrollbarAsNeeded}
`;

const Wrapper = ({ style }: { style: unknown }) => {
  const musicList = useMemo(
    () => new Array(getRandomInteger(5, 15)).fill(0),
    [],
  );
  return (
    <Style style={style}>
      {musicList.map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Skeleton key={index} />
      ))}
    </Style>
  );
};

export default Wrapper;
