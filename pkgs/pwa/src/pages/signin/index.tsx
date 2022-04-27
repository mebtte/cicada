import React from 'react';
import { connect } from 'react-redux';
import { Redirect, useLocation } from 'react-router-dom';

import { ROOT_PATH } from '@/constants/route';
import parseSearch from '@/utils/parse_search';
import { User } from '@/constants/user';
import Signin from './signin';

const Wrapper = ({ user }: { user: User | null }) => {
  const location = useLocation();
  if (user) {
    return (
      <Redirect
        to={decodeURIComponent(
          decodeURIComponent(
            parseSearch<'redirect'>(location.search).redirect,
          ) || ROOT_PATH.HOME,
        )}
      />
    );
  }
  return <Signin />;
};

export default connect(({ user }: { user: User | null }) => ({ user }))(
  Wrapper,
);
