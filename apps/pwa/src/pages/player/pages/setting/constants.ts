import { CSSProperties } from 'react';

export const itemStyle: CSSProperties = {
  margin: 20,
};

export const buttonItemStyle: CSSProperties = {
  ...itemStyle,
  display: 'flex',
  width: 'calc(100% - 40px)',
};
