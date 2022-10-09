import { ButtonHTMLAttributes, CSSProperties } from 'react';
import styled, { css } from 'styled-components';
import { ComponentSize } from '../constants/style';
import Spinner from './spinner';

const Style = styled.button<{ size: ComponentSize }>`
  position: relative;

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
    width: 75%;
    height: 75%;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    cursor: not-allowed;
    background-color: rgb(0 0 0 / 0.15);
  }

  ${({ size = ComponentSize.NORMAL }) => css`
    width: ${size}px;
    height: ${size}px;
  `}
`;
const spinnerStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
};

function IconButton({
  size = ComponentSize.NORMAL,
  loading = false,
  disabled = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ComponentSize;
  loading?: boolean;
}) {
  return (
    <Style {...props} size={size} disabled={disabled || loading}>
      {loading ? <Spinner style={spinnerStyle} size={size * 0.6} /> : children}
    </Style>
  );
}

export default IconButton;
