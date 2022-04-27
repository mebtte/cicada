import React from 'react';
import styled from 'styled-components';

import ErrorCard from '@/components/error_card';
import PageContainer from '../page_container';

const Style = styled(PageContainer)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ErrorDisplay = ({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) => (
  <Style>
    <ErrorCard
      errorMessage={`${error.message}\n获取设置失败, 失败的原因通常是客户端版本过低, 你可以尝试重试获取设置, 如尝试多次仍失败, 请更新客户端到最新版本`}
      retry={retry}
    />
  </Style>
);

export default ErrorDisplay;
