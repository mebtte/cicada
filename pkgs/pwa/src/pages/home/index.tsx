import React from 'react';
import { Redirect } from 'react-router-dom';

import { ROOT_PATH } from '@/constants/route';
import { IS_ELECTRON } from '@/platform/electron_new';
import Home from './home';

const Wrapper = () =>
  IS_ELECTRON ? <Redirect to={ROOT_PATH.PLAYER} /> : <Home />;

export default Wrapper;
