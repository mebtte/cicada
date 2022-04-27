import React from 'react';

import { PLAYER_PATH } from '@/constants/route';
import useHistory from '@/utils/use_history';
import { Musicbill as MusicbillType } from './constants';
import Cover from '../cover';
import MusicbillStyle from './musicbill_style';

const Musicbill = ({ musicbill }: { musicbill: MusicbillType }) => {
  const history = useHistory();
  const { id, name, cover } = musicbill;
  const onView = () =>
    history.push({ pathname: PLAYER_PATH.PUBLIC_MUSICBILL, query: { id } });
  return (
    <MusicbillStyle>
      <Cover src={cover} onClick={onView} />
      <div className="name" onClick={onView}>
        {name}
      </div>
    </MusicbillStyle>
  );
};

export default Musicbill;
