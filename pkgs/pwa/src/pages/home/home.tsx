import React from 'react';
import styled from 'styled-components';
import { useSelector, shallowEqual } from 'react-redux';
import { Helmet } from 'react-helmet';

import { User } from '@/constants/user';
import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import PageContainer from '../page_container';
import Header from './header';
import { CONTENT_MAX_WIDTH } from './constants';
import Footer from './footer';

const Style = styled(PageContainer)`
  background-color: #f3f3f3;
  overflow: auto;
  ${scrollbarAsNeeded}
  >.content {
    max-width: ${CONTENT_MAX_WIDTH}px;
    margin: 0 auto;
  }
`;

const Home = () => {
  const user = useSelector(
    ({ user: u }: { user: User | null }) => u,
    shallowEqual,
  );
  return (
    <Style>
      <Helmet>
        <title>知了 - 在线音乐播放器</title>
      </Helmet>
      <Header user={user} />
      <section className="content" />
      <Footer />
    </Style>
  );
};

export default Home;
