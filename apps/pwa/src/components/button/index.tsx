import * as React from 'react';
import styled, { css } from 'styled-components';
import CircularLoader from '#/components/spinner';
import { Type } from './constants';

const TYPE_MAP = {
  [Type.NORMAL]: {
    color: 'rgb(55 55 55)',
    backgroundColor: 'transparent',
    hoverBackgroundColor: 'rgb(0 0 0 / 0.04)',
    activeBackgroundColor: 'rgb(0 0 0 / 0.08)',
  },
  [Type.PRIMARY]: {
    color: '#fff',
    backgroundColor: 'rgb(49 194 124)',
    hoverBackgroundColor: 'rgb(49 154 124)',
    activeBackgroundColor: 'rgb(49 194 124)',
  },
  [Type.DANGER]: {
    color: '#fff',
    backgroundColor: 'rgb(220 0 78)',
    hoverBackgroundColor: 'rgb(154 0 54)',
    activeBackgroundColor: 'rgb(220 0 78)',
  },
};

const Style = styled.button<{
  isLoading: boolean;
  block: boolean;
  buttonType: Type;
}>`
  user-select: none;
  white-space: nowrap;
  position: relative;
  border: none;
  outline: none;
  border-radius: 4px;
  transition: all 300ms;
  cursor: pointer;
  > .loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  ${({ buttonType, isLoading, block }) => {
    const {
      color,
      backgroundColor,
      hoverBackgroundColor,
      activeBackgroundColor,
    } = TYPE_MAP[buttonType];
    return css`
      background-color: ${backgroundColor};
      display: ${block ? 'block' : 'inline-block'};
      width: ${block ? '100%' : 'auto'};
      color: ${isLoading ? 'transparent !important' : color};
      > .loader {
        color: ${color};
      }
      &:disabled {
        background-color: ${activeBackgroundColor} !important;
      }
      &:hover {
        background-color: ${hoverBackgroundColor};
      }
      &:active {
        background-color: ${activeBackgroundColor};
      }
    `;
  }}
`;

type Props = {
  /** 标签 */
  label: string;
  /** 尺寸 */
  size?: number;
  /** 类型 */
  type?: Type;
  /** 禁用 */
  disabled?: boolean;
  /** 加载中 */
  loading?: boolean;
  /** 块级按钮 */
  block?: boolean;
  style?: React.CSSProperties;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'>;

/**
 * 按钮
 * @author mebtte<hi@mebtte.com>
 */
// eslint-disable-next-line react/display-name
const Button = React.forwardRef<HTMLButtonElement, Props>(
  (
    {
      label,
      size = 32,
      type = Type.NORMAL,
      disabled = false,
      loading = false,
      block = false,
      style,
      ...props
    }: Props,
    ref,
  ) => {
    const loaderSize = size * 0.6;
    const fontSize = (size / 5) * 2;
    const padding = `0 ${size / 2}px`;
    return (
      <Style
        type="button"
        {...props}
        buttonType={type}
        disabled={disabled || loading}
        isLoading={loading}
        block={block}
        ref={ref}
        style={{
          height: size,
          fontSize,
          padding,
          ...style,
        }}
      >
        {label}
        {loading && <CircularLoader className="loader" size={loaderSize} />}
      </Style>
    );
  },
);

export { Type };
export default React.memo(Button);
