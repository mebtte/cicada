import styled, { keyframes } from 'styled-components';
import { CSSProperties, HtmlHTMLAttributes, memo } from 'react';
import { CSSVariable } from '../global_style';
import { ComponentSize } from '../constants/style';

const wavy = keyframes`
  0% {
    transform: scaleY(0.2);
  } 50% {
    transform: scaleY(1);
  } 100% {
    transform: scaleY(0.2);
  }
`;
const Style = styled.div`
  display: inline-flex;
  gap: 12.5%;

  > .item {
    flex: 1;
    min-width: 0;

    background-color: ${CSSVariable.COLOR_PRIMARY};
    animation-name: ${wavy};
    animation-duration: 1.25s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;

    &:nth-child(2),
    &:nth-child(4) {
      animation-delay: -0.3125s;
    }

    &:nth-child(3) {
      animation-delay: -0.625s;
    }
  }
`;

/**
 * 加载器
 * @author mebtte<hi@mebtte.com>
 */
function Spinner({
  size = ComponentSize.NORMAL,
  style,
  ...props
}: {
  /** 尺寸, 单位 px */
  size?: number;
  style?: CSSProperties;
} & HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <Style
      {...props}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    >
      <div className="item" />
      <div className="item" />
      <div className="item" />
      <div className="item" />
      <div className="item" />
    </Style>
  );
}

export default memo(Spinner);
