import React from 'react';
import styled, { css } from 'styled-components';

import { ComponentSize } from '@/constants/style';

const WIDTH = 2;
const SPACE = 0.15;
const THUMB_SIZE = 1 - SPACE * 2;

const Style = styled.div<{ open: boolean; disabled: boolean }>`
  position: relative;
  transition: 300ms;

  ${({ open, disabled }) => css`
    background-color: ${open ? 'var(--color-primary)' : 'rgb(0 0 0 / 0.2)'};
    opacity: ${disabled ? 0.5 : 1};
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
  `}
`;
const Thumb = styled.div<{ open: boolean }>`
  position: absolute;

  border-radius: 50%;
  background-color: #fff;
  transition: 300ms;
`;

const Switch = ({
  open,
  onChange,
  disabled = false,
  loading = false,
  size = ComponentSize.MINI,
  style,
}: {
  open: boolean;
  onChange?: (open: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: number;
  style?: React.CSSProperties;
}) => {
  const thumbSize = size * THUMB_SIZE;
  const space = size * SPACE;
  return (
    <Style
      open={open}
      disabled={disabled || loading}
      style={{
        width: size * WIDTH,
        height: size,
        borderRadius: size / 2,
        ...style,
      }}
      onClick={() => onChange(!open)}
    >
      <Thumb
        open={open}
        style={{
          top: space,
          left: open ? space : size * (WIDTH - SPACE - THUMB_SIZE),
          width: thumbSize,
          height: thumbSize,
        }}
      />
    </Style>
  );
};

export default Switch;
