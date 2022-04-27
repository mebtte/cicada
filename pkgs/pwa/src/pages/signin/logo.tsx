import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { ROOT_PATH } from '@/constants/route';

const Style = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0 30px 0;
  > .image {
    height: 45px;
  }
  > .text {
    height: 35px;
    margin-left: 15px;
  }
`;

const Logo = () => (
  <Style to={ROOT_PATH.HOME}>
    <img className="image" src="/logo.png" alt="logo" />
    <img className="text" src="/text_logo.png" alt="logo" />
  </Style>
);

export default React.memo(Logo);
