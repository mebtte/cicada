import React from 'react';
import { Redirect } from 'react-router-dom';

import { PLAYER_PATH } from '@/constants/route';
import useQuery from '@/utils/use_query';
import PublicMusicbill from './public_musicbill';

const Wrapper = () => {
  const { id } = useQuery<'id'>();
  if (!id) {
    return <Redirect to={PLAYER_PATH.RECOMMENDATION} />;
  }
  return <PublicMusicbill id={id} />;
};

export default Wrapper;
