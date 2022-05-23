import { lazy, Suspense } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import u from '@/global_state/user';
import { ROOT_PATH } from '@/constants/route';
import ErrorBoundary from '@/components/error_boundary';
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
    path: ROOT_PATH.LOGIN,
    component: lazy(
      () => import(/* webpackChunkName: "page_login" */ '../pages/login'),
    ),
  },
  {
    path: ROOT_PATH.PLAYER,
    component: lazy(
      () => import(/* webpackChunkName: "page_player" */ '../pages/player'),
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
const onErrorFallback = (error: Error) => <RouteLoader error={error} />;

function App() {
  const user = u.useState();
  return (
    <>
      <GlobalStyle />
      <Prefetch />

      <Toast />
      <Dialog />

      <ErrorBoundary fallback={onErrorFallback}>
        <Suspense fallback={<RouteLoader />}>
          <Switch>
            {routeList}
            <Redirect to={ROOT_PATH.HOME} />
          </Switch>
        </Suspense>
      </ErrorBoundary>

      {user ? <ProfileDialog user={user} /> : null}
    </>
  );
}

export default App;
