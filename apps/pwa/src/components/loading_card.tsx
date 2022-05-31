import { HtmlHTMLAttributes, memo } from 'react';
import styled from 'styled-components';
import CircularProgress from '@mui/material/CircularProgress';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  > .message {
    font-size: 12px;
    margin-top: 15px;
    color: rgb(150 150 150);
  }
`;

function LoadingDisplay({
  message,
  ...props
}: {
  message?: string;
} & HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <Style {...props}>
      <CircularProgress />
      {message ? <div className="message">{message}</div> : null}
    </Style>
  );
}

export default memo(LoadingDisplay);
