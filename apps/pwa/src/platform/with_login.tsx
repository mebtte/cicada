import { Navigate, useLocation } from 'react-router-dom';
import p from '@/global_states/profile';
import { ROOT_PATH } from '@/constants/route';
import { ComponentType } from 'react';
import { LoginQuery } from '@/constants/query';

function withLogin<Props = {}>(Component: ComponentType<Props>) {
  return function ComponentWithUser(props: Props) {
    const profile = p.useState();
    const { pathname } = useLocation();
    return profile ? (
      <Component {...props} />
    ) : (
      <Navigate
        to={`${ROOT_PATH.LOGIN}?${LoginQuery.REDIRECT}=${encodeURIComponent(
          pathname,
        )}`}
        replace
      />
    );
  };
}

export default withLogin;
