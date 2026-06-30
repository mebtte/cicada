import {
  css,
  DefaultTheme,
  FlattenInterpolation,
  ThemeProps,
} from 'styled-components';

/**
 * 精确指针且支持真实悬停的设备 (鼠标等), 用于区隔触摸设备.
 * 作为「悬停态」与「仅触摸设备才需要的交互件」共用的判定条件.
 */
export const FINE_POINTER_MEDIA = '(hover: hover) and (pointer: fine)';

/**
 * 仅在支持真实悬停的设备 (鼠标等精确指针) 上应用样式,
 * 规避触摸设备点击后 hover 状态粘滞的问题.
 *
 * 选择器由调用方书写, 以兼容后代/嵌套等复杂形态; 若内部样式依赖
 * styled 组件的 props, 通过 `css<Props>` 传入以保留类型推断:
 * ```ts
 * ${hover(css`
 *   &:not(:disabled):hover {
 *     filter: brightness(1.04);
 *   }
 * `)}
 * ```
 */
const hover = <P extends object = Record<string, never>>(
  style: FlattenInterpolation<ThemeProps<DefaultTheme> & P>,
) => css`
  @media ${FINE_POINTER_MEDIA} {
    ${style}
  }
`;

export default hover;
