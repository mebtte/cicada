import React from 'react';
import { Link } from 'react-router-dom';

import IconButton, { Type } from '@/components/icon_button';
import Tooltip from '@/components/tooltip';
import { LinkNavigator as LinkNavigatorType } from './constant';

const LinkNavigator = ({
  navigator,
  active,
  ...props
}: {
  navigator: LinkNavigatorType;
  active: boolean;
  [key: string]: any;
}) => (
  <Link to={navigator.link} {...props}>
    <Tooltip title={navigator.label}>
      <IconButton
        name={navigator.icon}
        type={active ? Type.PRIMARY : Type.NORMAL}
      />
    </Tooltip>
  </Link>
);

export default LinkNavigator;
