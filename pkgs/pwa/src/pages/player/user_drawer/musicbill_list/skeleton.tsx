import React from 'react';

import Skeleton from '@/components/skeleton';
import getRandomInteger from '@/utils/get_random_integer';
import Container from './container';
import {
  MUSICBILL_COVER_SIZE,
  MUSICBILL_COUNT_OF_ONE_LINE,
} from '../constants';

const Wrapper = () => (
  <Container>
    {new Array(MUSICBILL_COUNT_OF_ONE_LINE * 2).fill(0).map((_, index) => {
      return (
        // eslint-disable-next-line react/no-array-index-key
        <div className="musicbill" key={index}>
          <Skeleton
            width={MUSICBILL_COVER_SIZE}
            height={MUSICBILL_COVER_SIZE}
          />
          <div className="name">
            <Skeleton width={getRandomInteger(50, MUSICBILL_COVER_SIZE)} />
          </div>
        </div>
      );
    })}
  </Container>
);

export default React.memo(Wrapper);
