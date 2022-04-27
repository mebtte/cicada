import React, { useState } from 'react';

import getRandomInteger from '@/utils/get_random_integer';
import Skeleton from '@/components/skeleton';
import { MUSIC_NAME_SIZE } from './constant';
import Container from './container';
import SingerSkeleton from '../../components/singer/skeleton';

const Wrapper = (props) => {
  const [nameWidth] = useState(getRandomInteger(50, 120));
  return (
    <Container {...props}>
      <div className="text">
        <span className="name">
          <Skeleton width={nameWidth} height={MUSIC_NAME_SIZE} />
        </span>
        <span className="singers">
          <SingerSkeleton />
        </span>
      </div>
    </Container>
  );
};

export default Wrapper;
