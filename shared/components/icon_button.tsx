import { HTMLAttributes } from 'react';
import styled from 'styled-components';

const Style = styled.button`
  width: 28px;
  height: 28px;

  padding: 0;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  outline: none;
  border-radius: 50%;
  color: inherit;
  border: none;
  background-color: transparent;
  cursor: pointer;
  transition: all 250ms;

  > svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.15);
  }
`;

function IconButton(props: HTMLAttributes<HTMLButtonElement>) {
  return <Style {...props} />;
}

export default IconButton;
