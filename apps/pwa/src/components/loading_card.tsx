import { HtmlHTMLAttributes, memo } from 'react';
import styled from 'styled-components';
import CircularLoader from '#/components/spinner';

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
      <CircularLoader />
      {message ? <div className="message">{message}</div> : null}
    </Style>
  );
}

export default memo(LoadingDisplay);
