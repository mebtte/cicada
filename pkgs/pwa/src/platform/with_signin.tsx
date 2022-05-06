import { Redirect, useLocation } from 'react-router-dom';

import u from '@/platform/user';
import { ROOT_PATH } from '@/constants/route';
import { User } from '../constants/user';

const withSignin = () => (Component) => (props) => {
  const user = u.useUser();
  const { pathname } = useLocation();
  return user ? (
    <Component {...props} />
  ) : (
    <Redirect
      to={`${ROOT_PATH.SIGNIN}?redirect=${encodeURIComponent(pathname)}`}
    />
  );
};

export default withSignin;
