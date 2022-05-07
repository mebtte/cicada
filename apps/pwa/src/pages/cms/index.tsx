import styled from 'styled-components';
import { Switch, Route, Redirect } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { lazy, Suspense } from 'react';

import u from '@/platform/user';
import toast from '@/platform/toast';
import { CMS_PATH, ROOT_PATH } from '@/constants/route';
import { User } from '@/constants/user';
import withSignin from '@/platform/with_signin';
import PageContainer from '../page_container';
import PageLoader from './page_loader';
import Header from './header';
import Sidebar from './sidebar';
import JSONViewDialog from './json_view_dialog';

const ROUTES: {
  path: string;
  exact?: boolean;
  component: ReturnType<typeof lazy>;
}[] = [
  {
    path: CMS_PATH.DASHBOARD,
    exact: true,
    component: lazy(
      () =>
        import(
          /* webpackChunkName: "cms_dashboard_page" */ './pages/dashboard'
        ),
    ),
  },
  {
    path: CMS_PATH.USER,
    component: lazy(
      () => import(/* webpackChunkName: "cms_user_page" */ './pages/user'),
    ),
  },
  {
    path: CMS_PATH.FIGURE,
    component: lazy(
      () => import(/* webpackChunkName: "cms_figure_page" */ './pages/figure'),
    ),
  },
  {
    path: CMS_PATH.MUSIC,
    component: lazy(
      () => import(/* webpackChunkName: "cms_music_page" */ './pages/music'),
    ),
  },
  {
    path: CMS_PATH.PUBLIC_CONFIG,
    component: lazy(
      () =>
        import(
          /* webpackChunkName: "cms_public_config_page" */ './pages/public_config'
        ),
    ),
  },
];

const Scrollable = styled(PageContainer)`
  overflow: auto;
`;
const Style = styled.div`
  width: 100%;
  height: 100%;
  min-width: 1024px;
  display: flex;
  > .container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
`;
const routeList = ROUTES.map((r) => (
  <Route
    key={r.path}
    path={r.path}
    component={r.component}
    exact={r.exact || false}
  />
));

function Dashboard() {
  const user = u.useUser();
  if (!user || !user.cms) {
    toast.error('抱歉, 当前账号暂无 CMS 权限');
    return <Redirect to={ROOT_PATH.HOME} />;
  }
  return (
    <Scrollable>
      <Helmet>
        <title>内容管理系统 - 知了</title>
      </Helmet>
      <Style>
        <Sidebar />
        <div className="container">
          <Header />

          <Suspense fallback={<PageLoader />}>
            <Switch>
              {routeList}
              <Redirect to={CMS_PATH.DASHBOARD} />
            </Switch>
          </Suspense>
        </div>
      </Style>

      <JSONViewDialog />
    </Scrollable>
  );
}

export default withSignin()(Dashboard);
