import { memo } from 'react';
import styled from 'styled-components';
import { t } from '@/i18n';

const Style = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  user-select: none;

  .logo {
    height: 64px;
    width: 64px;
    object-fit: contain;
  }
`;

function Logo() {
  return (
    <Style>
      <img
        className="logo"
        src="/app_logo_v1.png"
        alt={t('logo')}
        crossOrigin="anonymous"
      />
    </Style>
  );
}

export default memo(Logo);
