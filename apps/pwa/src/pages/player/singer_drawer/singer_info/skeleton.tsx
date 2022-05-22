import { memo, useMemo } from 'react';

import getRandomInteger from '#/utils/generate_random_integer';
import Skeleton from '@/components/skeleton';
import { COVER_SIZE, Container } from './constants';

function Wrapper() {
  const nameWidth = useMemo(() => getRandomInteger(120, 200), []);
  return (
    <Container>
      <div className="info">
        <div className="name">
          <Skeleton width={nameWidth} />
        </div>
      </div>
      <Skeleton width={COVER_SIZE} height={COVER_SIZE} />
    </Container>
  );
}

export default memo(Wrapper);
