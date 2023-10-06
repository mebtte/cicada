import {
  ButtonHTMLAttributes,
  CSSProperties,
  ForwardedRef,
  forwardRef,
} from 'react';
import styled, { css } from 'styled-components';
import { ComponentSize } from '../constants/style';
import { CSSVariable } from '../global_style';
import Spinner from './spinner';

const SVG_PERCENTAGE = 0.75;
const Style = styled.button<{ size: ComponentSize }>`
  position: relative;
  -webkit-app-region: no-drag;

  padding: 0;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
  outline: none;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  border: none;
  background-color: transparent;
  cursor: pointer;
  transition: all 250ms;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  > svg {
    width: ${SVG_PERCENTAGE * 100}%;
    height: ${SVG_PERCENTAGE * 100}%;
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
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

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: number;
  loading?: boolean;
};

function IconButton(
  {
    size = ComponentSize.NORMAL,
    loading = false,
    disabled = false,
    children,
    ...props
  }: Props,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <Style {...props} size={size} disabled={disabled || loading} ref={ref}>
      {loading ? (
        <Spinner style={spinnerStyle} size={size * SVG_PERCENTAGE} />
      ) : (
        children
      )}
    </Style>
  );
}

export default forwardRef<HTMLButtonElement, Props>(IconButton);
