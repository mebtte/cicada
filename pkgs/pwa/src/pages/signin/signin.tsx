import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';

import getRandomCover from '../../utils/get_random_cover';
import { IS_ELECTRON, IS_WINDOWS } from '../../constants';
import PageContainer from '../page_container';
import Content from './content';
import AppRegion from './app_region';
import WindowsAction from './windows_action';
import SettingDialog from './setting_dialog';

const Style = styled(PageContainer)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
`;

const Signin = () => {
  const cover = useMemo(getRandomCover, []);
  return (
    <Style style={{ backgroundImage: `url(${cover})` }}>
      <Helmet>
        <title>登录 - 知了</title>
      </Helmet>
      {IS_ELECTRON ? (
        <>
          <AppRegion />
          {IS_WINDOWS && <WindowsAction />}
        </>
      ) : null}
      <Content />

      <SettingDialog />
    </Style>
  );
};

export default React.memo(Signin);
