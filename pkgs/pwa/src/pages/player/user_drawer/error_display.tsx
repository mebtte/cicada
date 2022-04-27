import React from 'react';
import styled from 'styled-components';
import { animated } from 'react-spring';

import ErrorCard from '@/components/error_card';
import { containerStyle } from './constants';

const Style = styled(animated.div)`
  ${containerStyle}

  display: flex;
  align-items: center;
  justify-content: center;
`;

const ErrorDisplay = ({
  error,
  reload,
  style,
}: {
  error: Error;
  reload: () => void;
  style: unknown;
}) => (
  <Style style={style}>
    <ErrorCard errorMessage={error.message} retry={reload} />
  </Style>
);

export default ErrorDisplay;
