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
  size = '1em',
  color,
  strokeWidth = 2.2,
  style,
  children,
  ...rest
}: IconProps) {
  // 仅当显式传入 color 时才写入内联样式, 避免默认 'currentColor' 覆盖外部 className 设置的 color
  const mergedStyle: CSSProperties | undefined =
    color !== undefined
      ? { color, ...(style as CSSProperties) }
      : (style as CSSProperties | undefined);
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
      style={mergedStyle}
      {...rest}
    >
      {children}
    </svg>
  );
}

export default Icon;
