import React from 'react';
import styled from 'styled-components';
import { animated } from 'react-spring';

import ErrorCard from '@/components/error_card';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

const Style = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const ErrorDisplay = ({
  id,
  error,
  style,
}: {
  id: string;
  error: Error;
  style: unknown;
}) => (
  <Style style={style}>
    <ErrorCard
      errorMessage={error.message}
      retry={() =>
        playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, { id })
      }
    />
  </Style>
);

export default ErrorDisplay;
