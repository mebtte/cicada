import { memo } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ROOT_PATH } from '@/constants/route';

const Style = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  user-select: none;

  .logo {
    height: 64px;
  }
`;

function Logo() {
  return (
    <Style>
      <Link to={ROOT_PATH.PLAYER}>
        <img
          className="logo"
          src="/logo.png"
          alt="logo"
          crossOrigin="anonymous"
        />
      </Link>
    </Style>
  );
}

export default memo(Logo);
