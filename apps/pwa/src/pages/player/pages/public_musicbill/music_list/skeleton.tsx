import { memo, useMemo } from 'react';

import getRandomInteger from '#/utils/generate_random_integer';
import Container from './container';
import { Skeleton as MusicSkeleton } from '../../../components/music';

function Wrapper() {
  const amount = useMemo(() => getRandomInteger(10, 30), []);
  return (
    <Container>
      {new Array(amount).fill(0).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <MusicSkeleton key={index} />
      ))}
    </Container>
  );
}

export default memo(Wrapper);
