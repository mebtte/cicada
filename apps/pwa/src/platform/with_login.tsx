import { Redirect, useLocation } from 'react-router-dom';
import u from '@/global_states/user';
import { ROOT_PATH } from '@/constants/route';
import { ComponentType } from 'react';
import { LoginQuery } from '@/constants/query';

function withLogin<Props = {}>(Component: ComponentType<Props>) {
  return function ComponentWithUser(props: Props) {
    const user = u.useState();
    const { pathname } = useLocation();
    return user ? (
      <Component {...props} />
    ) : (
      <Redirect
        to={`${ROOT_PATH.LOGIN}?${LoginQuery.REDIRECT}=${encodeURIComponent(
          pathname,
        )}`}
      />
    );
  };
}

export default withLogin;
