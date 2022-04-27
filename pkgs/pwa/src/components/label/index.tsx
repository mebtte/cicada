import React, { HTMLAttributes } from 'react';
import styled from 'styled-components';

const Style = styled.div`
  > .label {
    font-size: 12px;
    color: rgb(155 155 155);
  }
  > .input {
    margin-top: 5px;
  }
`;

const Label = ({
  label,
  children,
  ...props
}: React.PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    label: string;
  }
>) => (
  // eslint-disable-next-line react/jsx-indent
  <Style {...props}>
    <div className="label">{label}</div>
    <div className="input">{children}</div>
  </Style>
);

export default Label;
