import React from 'react';
import styled from 'styled-components';

import CircularLoader from '@/components/circular_loader';
import PageContainer from '../page_container';

const Style = styled(PageContainer)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Loading = () => (
  <Style>
    <CircularLoader />
  </Style>
);

export default Loading;
