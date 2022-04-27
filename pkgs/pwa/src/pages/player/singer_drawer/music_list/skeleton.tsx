import getRandomInteger from '@/utils/get_random_integer';
import React, { useMemo } from 'react';

import { Container } from './constants';
import { Skeleton } from '../../components/music';

const Wrapper = () => {
  const musicAmount = useMemo(() => getRandomInteger(3, 10), []);
  return (
    <Container topBoxShadow={0}>
      {new Array(musicAmount).fill(0).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Skeleton key={i} />
      ))}
    </Container>
  );
};

export default React.memo(Wrapper);
