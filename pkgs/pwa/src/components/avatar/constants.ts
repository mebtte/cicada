import React, { HTMLAttributes } from 'react';

export const BORDER_RADIUS = 4;

export enum Shape {
  SQUARE = 'square',
  CIRCLE = 'circle',
}

export type CommonProps = {
  /** 图片链接 */
  src: string;
  /** 尺寸, 数字单位 px 或者字符串 */
  size: number;
  /** 形状 */
  shape: Shape;
  style?: React.CSSProperties;
} & HTMLAttributes<HTMLDivElement>;

export const TRANSITION_LIST = [
  {
    initial: { opacity: 1, transform: 'translate(0%)' },
    from: { opacity: 0, transform: 'translate(100%)' },
    enter: { opacity: 1, transform: 'translate(0%)' },
    leave: { opacity: 0, transform: 'translate(-100%)' },
  },
  {
    initial: { opacity: 1, transform: 'translate(0%)' },
    from: { opacity: 0, transform: 'translate(-100%)' },
    enter: { opacity: 1, transform: 'translate(0%)' },
    leave: { opacity: 0, transform: 'translate(100%)' },
  },
];
