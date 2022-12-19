import { lazy, Suspense } from 'react';
import { Navigate, useRoutes, RouteObject } from 'react-router-dom';
import { ROOT_PATH } from '@/constants/route';
import ErrorBoundary from '@/components/error_boundary';
import RouteLoader from './route_loader';

const Login = lazy(
  () => import(/* webpackChunkName: "page_login" */ '../pages/login'),
);
const Player = lazy(
  () => import(/* webpackChunkName: "page_player" */ '../pages/player'),
);
const ROUTES: RouteObject[] = [
  {
    path: `${ROOT_PATH.PLAYER}/*`,
    element: <Player />,
  },
  {
    path: ROOT_PATH.LOGIN,
    element: <Login />,
  },
  {
    path: '*',
    element: <Navigate to={ROOT_PATH.PLAYER} replace />,
  },
];
const onErrorFallback = (error: Error) => <RouteLoader error={error} />;

function App() {
  const routes = useRoutes(ROUTES);
  return (
    <ErrorBoundary fallback={onErrorFallback}>
      <Suspense fallback={<RouteLoader />}>{routes}</Suspense>
    </ErrorBoundary>
  );
}

export default App;
