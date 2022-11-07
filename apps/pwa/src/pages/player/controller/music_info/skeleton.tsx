import { useState } from 'react';
import getRandomInteger from '#/utils/generate_random_integer';
import Skeleton from '@/components/skeleton';
import { MUSIC_NAME_SIZE } from './constant';
import Container from './container';

function Wrapper(props) {
  const [nameWidth] = useState(getRandomInteger(50, 120));
  return (
    <Container {...props}>
      <div className="text">
        <span className="name">
          <Skeleton width={nameWidth} height={MUSIC_NAME_SIZE} />
        </span>
      </div>
    </Container>
  );
}

export default Wrapper;
