import React from 'react';
import styled from 'styled-components';

import CircularLoader from './circular_loader';

const LOADER_SIZE = 24;
const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  > .loader {
    color: rgb(55 55 55);
  }
  > .message {
    font-size: 12px;
    margin-top: 15px;
    color: rgb(150 150 150);
  }
`;

const LoadingDisplay = ({
  message,
  ...props
}: {
  message?: string;
  [key: string]: any;
}) => (
  <Style {...props}>
    <CircularLoader className="loader" size={LOADER_SIZE} />
    {message ? <div className="message">{message}</div> : null}
  </Style>
);

export default React.memo(LoadingDisplay);
