import React from 'react';
import styled from 'styled-components';
import { Switch, Route, Redirect } from 'react-router-dom';
import loadable from 'react-loadable';
import { shallowEqual, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet';

import toast from '@/platform/toast';
import { CMS_PATH, ROOT_PATH } from '@/constants/route';
import { User } from '@/constants/user';
import withSignin from '@/platform/with_signin';
import PageContainer from '../page_container';
import PageLoader from './page_loader';
import Header from './header';
import Sidebar from './sidebar';
import JSONViewDialog from './json_view_dialog';

const ROUTE = {
  [CMS_PATH.DASHBOARD]: loadable({
    loader: () =>
      import(/* webpackChunkName: "cms_dashboard_page" */ './pages/dashboard'),
    loading: PageLoader,
    timeout: 30000,
    delay: 300,
  }),
  [CMS_PATH.USER]: loadable({
    loader: () =>
      import(/* webpackChunkName: "cms_user_page" */ './pages/user'),
    loading: PageLoader,
    timeout: 30000,
    delay: 300,
  }),
  [CMS_PATH.FIGURE]: loadable({
    loader: () =>
      import(/* webpackChunkName: "cms_figure_page" */ './pages/figure'),
    loading: PageLoader,
    timeout: 30000,
    delay: 300,
  }),
  [CMS_PATH.MUSIC]: loadable({
    loader: () =>
      import(/* webpackChunkName: "cms_music_page" */ './pages/music'),
    loading: PageLoader,
    timeout: 30000,
    delay: 300,
  }),
  [CMS_PATH.PUBLIC_CONFIG]: loadable({
    loader: () =>
      import(
        /* webpackChunkName: "cms_public_config_page" */ './pages/public_config'
      ),
    loading: PageLoader,
    timeout: 30000,
    delay: 300,
  }),
};

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
const routeList = Object.keys(ROUTE).map((path) => (
  <Route
    key={path}
    path={path}
    component={ROUTE[path]}
    exact={path === CMS_PATH.DASHBOARD}
  />
));

const Dashboard = () => {
  const user = useSelector((state: { user: User }) => state.user, shallowEqual);
  if (!user.cms) {
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
          <Switch>
            {routeList}
            <Redirect to={CMS_PATH.DASHBOARD} />
          </Switch>
        </div>
      </Style>

      <JSONViewDialog />
    </Scrollable>
  );
};

export default withSignin()(Dashboard);
