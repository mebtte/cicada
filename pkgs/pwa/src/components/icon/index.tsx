/* eslint-disable no-shadow */
import React from 'react';

import { Svg } from './base';
import { Name, NAME_MAP_CONTENT } from './constants';

interface Props {
  /** 图标名 */
  name: Name;
  /** 尺寸, 数字单位 px 或字符串 */
  size?: number | string;
  [key: string]: any;
}

/**
 * 图标
 * @author mebtte<hi@mebtte.com>
 */
const Icon = React.forwardRef<SVGSVGElement, Props>(
  ({ name, size = '1em', ...props }: Props, ref) => {
    const Content = NAME_MAP_CONTENT[name];
    return (
      <Svg
        {...props}
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 1024 1024"
      >
        <Content />
      </Svg>
    );
  },
);

export { Name };
export default React.memo(Icon);
