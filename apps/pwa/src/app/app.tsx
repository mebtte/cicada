import { lazy, Suspense, useEffect } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import * as Sentry from '@sentry/browser';


import u from '@/platform/user';
import { ROOT_PATH } from '@/constants/route';
import GlobalStyle from './global_style';
import Toast from './toast';
import Dialog from './dialog';
import RouteLoader from './route_loader';
import ProfileDialog from './profile_dialog';
import Prefetch from './prefetch';

const ROUTES: {
  path: string;
  exact?: boolean;
  component: ReturnType<typeof lazy>;
}[] = [
  {
    path: ROOT_PATH.HOME,
    exact: true,
    component: lazy(
      () => import(/* webpackChunkName: "page_home" */ '../pages/home'),
    ),
  },
  {
    path: ROOT_PATH.SIGNIN,
    component: lazy(
      () => import(/* webpackChunkName: "page_signin" */ '../pages/signin'),
    ),
  },
  {
    path: ROOT_PATH.PLAYER,
    component: lazy(
      () => import(/* webpackChunkName: "page_player" */ '../pages/player'),
    ),
  },
  {
    path: ROOT_PATH.CMS,
    component: lazy(
      () => import(/* webpackChunkName: "page_cms" */ '../pages/cms'),
    ),
  },
];

const routeList = ROUTES.map((r) => (
  <Route
    key={r.path}
    path={r.path}
    component={r.component}
    exact={r.exact || false}
  />
));

function App() {
  const user = u.useUser();

  useEffect(() => {
    if (user) {
      Sentry.configureScope((scope) => scope.setUser({ id: user.id }));
    }
  }, [user]);

  return (
    <>
      <GlobalStyle />
      <Prefetch />

      <Toast />
      <Dialog />

      <Suspense fallback={<RouteLoader />}>
        <Switch>
          {routeList}
          <Redirect to={ROOT_PATH.HOME} />
        </Switch>
      </Suspense>

      {user ? <ProfileDialog user={user} /> : null}
    </>
  );
}

export default App;
