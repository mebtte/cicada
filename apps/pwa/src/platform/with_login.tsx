import { Navigate, useLocation } from 'react-router-dom';
import p from '@/global_states/profile';
import { ROOT_PATH } from '@/constants/route';
import { ComponentType } from 'react';
import { Query } from '@/constants';

function withLogin<Props = {}>(Component: ComponentType<Props>) {
  return function ComponentWithUser(props: Props) {
    const profile = p.useState();
    const { pathname } = useLocation();
    return profile ? (
      // @ts-expect-error
      <Component {...props} />
    ) : (
      <Navigate
        to={`${ROOT_PATH.LOGIN}?${Query.REDIRECT}=${encodeURIComponent(
          pathname,
        )}`}
        replace
      />
    );
  };
}

export default withLogin;
