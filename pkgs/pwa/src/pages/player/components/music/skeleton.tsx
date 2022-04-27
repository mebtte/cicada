import React, { useMemo } from 'react';

import getRandomInteger from '@/utils/get_random_integer';
import Skeleton from '@/components/skeleton';
import SingerSkeleton from '../singer/skeleton';
import Container from './container';

const Wrapper = (props: { [key: string]: any }) => {
  const nameWidth = useMemo(() => getRandomInteger(50, 150), []);
  return (
    <Container {...props}>
      <div className="index">
        <Skeleton width={25} />
      </div>
      <div className="info">
        <div className="top">
          <div className="text">
            <Skeleton width={nameWidth} />
          </div>
        </div>
        <div className="singers">
          <SingerSkeleton />
        </div>
      </div>
    </Container>
  );
};

export default React.memo(Wrapper);
