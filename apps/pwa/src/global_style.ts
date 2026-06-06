import { createGlobalStyle } from 'styled-components';

export { CSSVariable } from '@/style/tokens_style';

/**
 * PWA 宿主壳样式:body 不滚动、全局禁用 user-select、macOS PWA 标题栏拖拽控制等。
 * 这些规则只在主 App 里需要,Storybook 单组件预览不应包含,否则会出现
 * 组件详情页无法滚动等问题。
 */
export const GlobalStyle = createGlobalStyle`
  * {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  html {
    overscroll-behavior-x: none;
  }

  body {
    overscroll-behavior: contain;
    overscroll-behavior-x: none;
    overflow: hidden;
  }

  button,
  input,
  textarea,
  select,
  a,
  [role='button'] {
    /* 标题栏拖拽区域内的交互控件必须显式退出 drag, 否则 macOS PWA 会吞掉点击。 */
    -webkit-app-region: no-drag;
  }
`;
