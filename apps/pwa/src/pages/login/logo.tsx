import { memo } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ROOT_PATH } from '@/constants/route';

const Style = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  .logo {
    height: 64px;
  }
`;

function Logo() {
  return (
    <Style>
      <Link to={ROOT_PATH.HOME}>
        <img
          className="logo"
          src="/logo.png"
          alt="logo"
          crossOrigin="anonymous"
          loading="lazy"
        />
      </Link>
    </Style>
  );
}

export default memo(Logo);
