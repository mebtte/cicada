import getRandomInteger from '#/utils/generate_random_integer';
import { memo, useMemo } from 'react';

import { Container } from './constants';
import { Skeleton } from '../../components/music';

function Wrapper() {
  const musicAmount = useMemo(() => getRandomInteger(3, 10), []);
  return (
    <Container topBoxShadow={0}>
      {new Array(musicAmount).fill(0).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Skeleton key={i} />
      ))}
    </Container>
  );
}

export default memo(Wrapper);
