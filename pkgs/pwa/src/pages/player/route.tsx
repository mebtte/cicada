import React from 'react';
import styled from 'styled-components';
import { Switch, Route, useLocation } from 'react-router-dom';
import { useTransition, animated } from 'react-spring';

import { PLAYER_PATH } from '@/constants/route';
import Recommendation from './pages/recommendation';
import Search from './pages/search';
import Musicbill from './pages/musicbill';
import PublicMusicbill from './pages/public_musicbill';
import Setting from './pages/setting';

const Style = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
`;
const AnimatedDiv = styled(animated.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;

const Wrapper = () => {
  const location = useLocation();
  const transitions = useTransition(location, {
    from: { opacity: 0, transform: 'translate(-100%)' },
    enter: { opacity: 1, transform: 'translate(0%)' },
    leave: { opacity: 0, transform: 'translate(100%)' },
  });
  return (
    <Style>
      {transitions((style, l) => (
        <AnimatedDiv style={style}>
          <Switch location={l}>
            <Route path={PLAYER_PATH.SEARCH} component={Search} />
            <Route path={PLAYER_PATH.MUSICBILL} component={Musicbill} />
            <Route
              path={PLAYER_PATH.PUBLIC_MUSICBILL}
              component={PublicMusicbill}
            />
            <Route path={PLAYER_PATH.SETTING} component={Setting} />
            <Route path="*" component={Recommendation} />
          </Switch>
        </AnimatedDiv>
      ))}
    </Style>
  );
};

export default Wrapper;
