import { memo } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import LinkNavigator from './link_navigator';
import ActionNavigator from './action_navigator';
import { NavigatorType, NAVIGATORS } from './constant';

const navigatorStyle = {
  margin: '0 5px',
};

const Style = styled.div`
  text-align: center;
`;

function Menu() {
  const { pathname } = useLocation();

  return (
    <Style>
      {NAVIGATORS.map((n) => {
        switch (n.type) {
          case NavigatorType.LINK:
            return (
              <LinkNavigator
                key={n.key}
                navigator={n}
                active={pathname === n.link}
                style={navigatorStyle}
              />
            );
          case NavigatorType.ACTION: {
            return (
              <ActionNavigator
                key={n.key}
                navigator={n}
                style={navigatorStyle}
              />
            );
          }
          default:
            return null;
        }
      })}
    </Style>
  );
}

export default memo(Menu);
