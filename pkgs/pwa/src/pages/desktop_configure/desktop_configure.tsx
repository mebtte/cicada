import React, { ReactNode } from 'react';
import { Helmet } from 'react-helmet';

import { RequestStatus } from '@/constants';
import useData from './use_data';
import Loading from './loading';
import ErrorDisplay from './error_display';
import Content from './content';

const DesktopConfigure = () => {
  const { status, error, retry, pwaOrigin } = useData();

  let content: ReactNode;
  if (status === RequestStatus.SUCCESS) {
    content = <Content pwaOrigin={pwaOrigin} />;
  } else if (status === RequestStatus.LOADING) {
    content = <Loading />;
  } else {
    content = <ErrorDisplay error={error!} retry={retry} />;
  }

  return (
    <>
      <Helmet>
        <title>配置</title>
      </Helmet>
      {content}
    </>
  );
};

export default DesktopConfigure;
