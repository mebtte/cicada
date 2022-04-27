import React from 'react';
import styled from 'styled-components';

import {
  minimizePlayerWindow,
  hidePlayerWindow,
} from '@/platform/electron_new';
import IconButton, { Name } from '@/components/icon_button';

const Style = styled.div`
  -webkit-app-region: no-drag;
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 2px 5px;
  border-radius: 2px;
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.6);
  > .button:not(:last-child) {
    margin-right: 5px;
  }
`;

const Action = () => (
  <Style>
    <IconButton
      name={Name.MINIMIZE_OUTLINE}
      className="button"
      onClick={minimizePlayerWindow}
    />
    <IconButton
      name={Name.WRONG_OUTLINE}
      className="button"
      onClick={hidePlayerWindow}
    />
  </Style>
);

export default Action;
