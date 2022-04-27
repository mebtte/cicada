import React from 'react';

import IconButton from '@/components/icon_button';
import Tooltip from '@/components/tooltip';
import { ActionNavigator as ActionNavigatorType } from './constant';

const ActionNavigator = ({
  navigator,
  ...props
}: {
  navigator: ActionNavigatorType;
  [key: string]: any;
}) => (
  <Tooltip title={navigator.label}>
    <IconButton {...props} name={navigator.icon} onClick={navigator.action} />
  </Tooltip>
);

export default ActionNavigator;
