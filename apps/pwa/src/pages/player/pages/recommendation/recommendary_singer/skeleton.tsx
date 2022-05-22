import { memo } from 'react';

import Avatar from '@/components/avatar';
import getRandomInteger from '#/utils/generate_random_integer';
import Skeleton from '@/components/skeleton';
import Style from './singer_style';
import { COVER_SIZE } from '../constants';

function Wrapper() {
  return (
    <>
      {new Array(30).fill(0).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Style key={index}>
          <Avatar size={COVER_SIZE} />
          <div className="name">
            <Skeleton width={getRandomInteger(30, COVER_SIZE)} />
          </div>
        </Style>
      ))}
    </>
  );
}

export default memo(Wrapper);