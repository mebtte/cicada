import { memo, useState } from 'react';

import getRandomInteger from '@/utils/get_random_integer';
import Skeleton from '@/components/skeleton';

const Wrapper = () => {
  const [width] = useState(getRandomInteger(30, 100));
  return <Skeleton width={width} />;
};

export default memo(Wrapper);
