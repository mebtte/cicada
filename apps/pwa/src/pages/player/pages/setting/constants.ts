import { CSSProperties } from 'react';

export const itemStyle: CSSProperties = {
  margin: 20,
};

export const buttonItemStyle: CSSProperties = {
  ...itemStyle,
  display: 'block',
  width: 'calc(100% - 40px)',
};
