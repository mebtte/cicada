import { memo } from 'react';
import styled from 'styled-components';

const Style = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  > .logo {
    height: 48px;
  }
`;

function Logo() {
  return (
    <Style>
      <img className="logo" src="/text_logo.png" alt="logo" />
    </Style>
  );
}

export default memo(Logo);
