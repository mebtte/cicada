import React from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { User } from '@/constants/user';
import LinkNavigator from './link_navigator';
import ActionNavigator from './action_navigator';
import { NavigatorType, NAVIGATORS, NavigatorKey } from './constant';

const navigatorStyle = {
  margin: '0 5px',
};

const Style = styled.div`
  text-align: center;
`;

const Menu = ({ user }: { user: User }) => {
  const { pathname } = useLocation();

  let navigators = NAVIGATORS;
  if (!user.cms) {
    navigators = navigators.filter((n) => n.key !== NavigatorKey.CMS);
  }

  return (
    <Style>
      {navigators.map((n) => {
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
};

export default React.memo(Menu);
