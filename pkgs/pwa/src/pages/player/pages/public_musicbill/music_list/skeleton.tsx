import React, { useMemo } from 'react';

import getRandomInteger from '@/utils/get_random_integer';
import Container from './container';
import { Skeleton as MusicSkeleton } from '../../../components/music';

const Wrapper = () => {
  const amount = useMemo(() => getRandomInteger(10, 30), []);
  return (
    <Container>
      {new Array(amount).fill(0).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <MusicSkeleton key={index} />
      ))}
    </Container>
  );
};

export default React.memo(Wrapper);
