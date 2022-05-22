import { Redirect, useLocation } from 'react-router-dom';
import u from '@/global_state/user';
import { ROOT_PATH } from '@/constants/route';
import { ComponentType } from 'react';

function withSignin<Props = {}>(Component: ComponentType<Props>) {
  return function ComponentWithUser(props: Props) {
    const user = u.useState();
    const { pathname } = useLocation();
    return user ? (
      <Component {...props} />
    ) : (
      <Redirect
        to={`${ROOT_PATH.LOGIN}?redirect=${encodeURIComponent(pathname)}`}
      />
    );
  };
}

export default withSignin;
