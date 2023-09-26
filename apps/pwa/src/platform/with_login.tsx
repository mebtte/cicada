import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/global_states/server';
import { ROOT_PATH } from '@/constants/route';
import { ComponentType } from 'react';
import { Query } from '@/constants';

function withLogin<Props = {}>(Component: ComponentType<Props>) {
  return function ComponentWithUser(props: Props) {
    const user = useUser();
    const { pathname, search } = useLocation();
    return user ? (
      // @ts-expect-error
      <Component {...props} />
    ) : (
      <Navigate
        to={`${ROOT_PATH.LOGIN}?${Query.REDIRECT}=${encodeURIComponent(
          pathname + search,
        )}`}
        replace
      />
    );
  };
}

export default withLogin;
