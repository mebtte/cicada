import styled from 'styled-components';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useTransition, animated } from 'react-spring';
import { PLAYER_PATH } from '@/constants/route';
import Home from './pages/home';
import Search from './pages/search';
import Musicbill from './pages/musicbill';
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

function Wrapper() {
  const location = useLocation();
  const transitions = useTransition(location, {
    from: { opacity: 0, transform: 'translate(-100%)' },
    enter: { opacity: 1, transform: 'translate(0%)' },
    leave: { opacity: 0, transform: 'translate(100%)' },
  });
  return (
    <Style>
      {transitions((style) => (
        <AnimatedDiv style={style}>
          <Routes>
            <Route path={PLAYER_PATH.SEARCH} element={<Search />} />
            <Route path={PLAYER_PATH.MUSICBILL} element={<Musicbill />} />
            <Route path={PLAYER_PATH.SETTING} element={<Setting />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </AnimatedDiv>
      ))}
    </Style>
  );
}

export default Wrapper;
