import React from 'react';
import styled, { css } from 'styled-components';

import { ComponentSize } from '@/constants/style';
import Icon, { Name } from '../icon';
import CircularLoader from '../circular_loader';
import { Type } from './constants';

const TYPE_MAP = {
  [Type.NORMAL]: {
    color: 'rgb(55 55 55)',
  },
  [Type.PRIMARY]: {
    color: 'rgb(49 194 124)',
  },
  [Type.DANGER]: {
    color: 'rgb(220 0 78)',
  },
};

const Style = styled.button<{
  uType: Type;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  outline: none;
  border-radius: 4px;
  background-color: transparent;
  cursor: pointer;
  transition: all 300ms;
  &:focus,
  &:hover {
    background-color: rgb(0 0 0 / 0.04);
  }
  &:active {
    background-color: rgb(0 0 0 / 0.08);
  }
  &:disabled {
    opacity: 0.5;
    background-color: rgb(0 0 0 / 0.2) !important;
    cursor: not-allowed !important;
  }
  ${({ uType }) => {
    const { color } = TYPE_MAP[uType];
    return css`
      color: ${color};
    `;
  }}
`;

interface Props {
  /** icon name */
  name: Name;
  /** 类型 */
  type?: Type;
  /** 尺寸, 单位 px */
  size?: number;
  /** 禁用 */
  disabled?: boolean;
  /** 加载中 */
  loading?: boolean;
  style?: React.CSSProperties;
  [key: string]: any;
}

/**
 * 图标按钮
 * @author mebtte<hi@mebtte.com>
 */
const IconButton = React.forwardRef<HTMLButtonElement, Props>(
  (
    {
      name,
      type = Type.NORMAL,
      size = ComponentSize.NORMAL,
      disabled = false,
      loading = false,
      style,
      ...props
    }: Props,
    ref,
  ) => {
    const iconSize = size * 0.7;
    return (
      <Style
        type="button"
        {...props}
        uType={type}
        disabled={disabled || loading}
        style={{
          ...style,
          width: size,
          height: size,
        }}
        ref={ref}
      >
        {loading ? (
          <CircularLoader size={iconSize} />
        ) : (
          <Icon name={name} size={iconSize} />
        )}
      </Style>
    );
  },
);

export { Name, Type };
export default React.memo(IconButton);
