import React from 'react';

import { Musicbill as MusicbillType } from './constants';
import Musicbill from './musicbill';

const MusicbillList = ({
  musicbillList,
}: {
  musicbillList: MusicbillType[];
}) => (
  <>
    {musicbillList.map((m) => (
      <Musicbill key={m.id} musicbill={m} />
    ))}
  </>
);

export default React.memo(MusicbillList);
