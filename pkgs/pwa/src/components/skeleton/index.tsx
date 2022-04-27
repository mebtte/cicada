import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

const INITIAL_BACKGROUND_COLOR = 'rgb(0 0 0 / 0.05)';
const wave = keyframes`
  0% {
    background-color: ${INITIAL_BACKGROUND_COLOR};
  } 100% {
    background-color: rgb(0 0 0 / 0.08);
  }
`;

const Style = styled.div`
  display: inline-block;
  vertical-align: middle;
  border-radius: 4px;
  animation: ${wave} 0.8s ease-in-out infinite alternate;
  background-color: ${INITIAL_BACKGROUND_COLOR};
`;

/**
 * 骨架
 * @author mebtte<hi@mebtte.com>
 */
const Skeleton = ({
  width = '100%',
  height = '1em',
  style,
  ...props
}: {
  /** 长度 */
  width?: number | string;
  /** 高度 */
  height?: number | string;
  style?: React.CSSProperties;
  [key: string]: any;
}) => {
  const delay = useMemo(() => Math.random(), []);
  return (
    <Style
      {...props}
      style={{
        width,
        height,
        animationDelay: `${delay}s`,
        ...style,
      }}
    />
  );
};

export default React.memo(Skeleton);
