import { CSSProperties, ReactNode, SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  children?: ReactNode;
}

/**
 * 基础 SVG 容器，由各具名 Icon 组件内部使用。
 * 风格规范：strokeLinecap / strokeLinejoin = round，颜色走 currentColor。
 */
function Icon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  style,
  children,
  ...rest
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color, ...(style as CSSProperties) }}
      {...rest}
    >
      {children}
    </svg>
  );
}

export default Icon;
