import React from 'react';
import styled from 'styled-components';

import ErrorCard from '@/components/error_card';
import CircularLoader from '@/components/circular_loader';
import { cmsPage } from './style';

const Style = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  ${cmsPage};
`;

const PageLoader = ({ error }: { error?: Error }) => (
  <Style>
    {error ? (
      <ErrorCard
        errorMessage={error.message}
        retry={() => window.location.reload()}
      />
    ) : (
      <CircularLoader />
    )}
  </Style>
);

export default PageLoader;
