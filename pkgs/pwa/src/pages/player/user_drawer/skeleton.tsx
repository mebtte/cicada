import React, { useMemo } from 'react';

import getRandomInteger from '@/utils/get_random_integer';
import Skeleton from '@/components/skeleton';
import Container from './container';
import { MUSICBILL_COVER_SIZE } from './constants';
import MusicbillListSkeleton from './musicbill_list/skeleton';

const coverStyle = {
  borderRadius: '50%',
};

const Wrapper = ({ style }: { style: unknown }) => {
  const nameWidth = useMemo(() => getRandomInteger(100, 200), []);
  const joinTimeWidth = useMemo(() => getRandomInteger(100, 200), []);
  return (
    <Container style={style}>
      <div className="top">
        <Skeleton
          width={MUSICBILL_COVER_SIZE}
          height={MUSICBILL_COVER_SIZE}
          style={coverStyle}
        />
        <div className="info">
          <div className="name">
            <Skeleton width={nameWidth} />
          </div>
          <div className="join-time">
            <Skeleton width={joinTimeWidth} />
          </div>
        </div>
      </div>
      <MusicbillListSkeleton />
    </Container>
  );
};

export default Wrapper;
