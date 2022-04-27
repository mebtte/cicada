import React from 'react';

import getRandomInteger from '@/utils/get_random_integer';
import Skeleton from '@/components/skeleton';
import Container from './container';
import { COVER_SIZE, AVATAR_SIZE } from './constants';

const avatarStyle = {
  borderRadius: '50%',
};

const Wrapper = () => (
  <Container>
    <Skeleton width={COVER_SIZE} height={COVER_SIZE} />
    <div className="info">
      <div className="name">
        <Skeleton width={getRandomInteger(100, 250)} />
      </div>
      <div className="description">
        <Skeleton width={getRandomInteger(100, 250)} />
      </div>
      <div className="user">
        <Skeleton
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          style={avatarStyle}
        />
        <div className="name">
          <Skeleton width={getRandomInteger(100, 250)} />
        </div>
      </div>
    </div>
  </Container>
);

export default React.memo(Wrapper);
