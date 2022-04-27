import React, { useEffect } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import loadable from 'react-loadable';
import { shallowEqual, useSelector } from 'react-redux';
import * as Sentry from '@sentry/browser';

import { User } from '@/constants/user';
import { ROOT_PATH } from '@/constants/route';
import GlobalStyle from './global_style';
import Toast from './toast';
import Dialog from './dialog';
import RouteLoader from './route_loader';
import ProfileDialog from './profile_dialog';
import Prefetch from './prefetch';

const ROUTE_MAP_COMPONENT = {
  [ROOT_PATH.HOME]: loadable({
    loader: () => import(/* webpackChunkName: "page_home" */ '../pages/home'),
    loading: RouteLoader,
    timeout: 30000,
    delay: 300,
  }),
  [ROOT_PATH.SIGNIN]: loadable({
    loader: () =>
      import(/* webpackChunkName: "page_signin" */ '../pages/signin'),
    loading: RouteLoader,
    timeout: 30000,
    delay: 300,
  }),
  [ROOT_PATH.PLAYER]: loadable({
    loader: () =>
      import(/* webpackChunkName: "page_player" */ '../pages/player'),
    loading: RouteLoader,
    timeout: 30000,
    delay: 300,
  }),
  [ROOT_PATH.CMS]: loadable({
    loader: () => import(/* webpackChunkName: "page_cms" */ '../pages/cms'),
    loading: RouteLoader,
    timeout: 30000,
    delay: 300,
  }),
  [ROOT_PATH.DESKTOP_CONFIGURE]: loadable({
    loader: () =>
      import(
        /* webpackChunkName: "page_electron_setting" */ '../pages/desktop_configure'
      ),
    loading: RouteLoader,
    timeout: 30000,
    delay: 300,
  }),
};

const routeList = Object.keys(ROUTE_MAP_COMPONENT).map((path) => (
  <Route
    key={path}
    path={path}
    component={ROUTE_MAP_COMPONENT[path]}
    exact={path === ROOT_PATH.HOME}
  />
));

const App = () => {
  const user = useSelector(
    ({ user: u }: { user: User | null }) => u,
    shallowEqual,
  );

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

      <Switch>
        {routeList}
        <Redirect to={ROOT_PATH.HOME} />
      </Switch>

      {user ? <ProfileDialog user={user} /> : null}
    </>
  );
};

export default App;
