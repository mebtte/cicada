import React from 'react';

import { Figure } from '../../../constants';
import Singer from './singer';

const SingerList = ({ singerList }: { singerList: Figure[] }) => (
  <>
    {singerList.map((s) => (
      <Singer key={s.id} singer={s} />
    ))}
  </>
);

export default React.memo(SingerList);
