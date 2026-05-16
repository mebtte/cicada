import { CSSProperties } from 'react';
import { PAGE_HORIZONTAL_PADDING } from '../page';

export const itemStyle: CSSProperties = {
  margin: `20px ${PAGE_HORIZONTAL_PADDING}`,
};

export const buttonItemStyle: CSSProperties = {
  ...itemStyle,
  display: 'flex',
  width: `calc(100% - ${PAGE_HORIZONTAL_PADDING} - ${PAGE_HORIZONTAL_PADDING})`,
};
