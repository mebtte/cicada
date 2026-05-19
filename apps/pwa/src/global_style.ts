import { createGlobalStyle } from 'styled-components';

export enum CSSVariable {
  COLOR_PRIMARY = 'var(--color-primary)',
  COLOR_PRIMARY_DISABLED = 'var(--color-primary-disabled)',
  COLOR_PRIMARY_ACTIVE = 'var(--color-primary-active)',
  COLOR_DANGEROUS = 'var(--color-dangerous)',
  COLOR_BORDER = 'var(--color-border)',
  COLOR_CONTROL_NEUTRAL = 'var(--color-control-neutral)',
  COLOR_DISABLED_SHADOW = 'var(--color-disabled-shadow)',
  COLOR_SURFACE_SHADOW = 'var(--color-surface-shadow)',

  TEXT_SIZE_TITLE = 'var(--text-size-title)',
  TEXT_SIZE_LARGE = 'var(--text-size-large)',
  TEXT_SIZE_NORMAL = 'var(--text-size-normal)',
  TEXT_SIZE_SMALL = 'var(--text-size-small)',

  TEXT_COLOR_PRIMARY = 'var(--text-color-primary)',
  TEXT_COLOR_SECONDARY = 'var(--text-color-secondary)',
  TEXT_COLOR_DISABLED = 'var(--text-color-disabled)',

  BACKGROUND_DISABLED = 'var(--background-disabled)',
  BACKGROUND_COLOR_LEVEL_ONE = 'var(--background-color-level-one)',
  BACKGROUND_COLOR_LEVEL_TWO = 'var(--background-color-level-two)',
  BACKGROUND_COLOR_LEVEL_THREE = 'var(--background-color-level-three)',
  BACKGROUND_COLOR_LEVEL_FOUR = 'var(--background-color-level-four)',
  BACKGROUND_COLOR_LEVEL_FIVE = 'var(--background-color-level-five)',

  BORDER_RADIUS_LIGHT = 'var(--border-radius-light)',
  BORDER_RADIUS_NORMAL = 'var(--border-radius-normal)',
}

const CSS_VARIABLE_MAP_VALUE: Record<CSSVariable, string> = {
  [CSSVariable.COLOR_PRIMARY]: 'rgb(44 182 125)',
  [CSSVariable.COLOR_PRIMARY_DISABLED]: '#7bd5b0',
  [CSSVariable.COLOR_PRIMARY_ACTIVE]: '#1d8b5e',
  [CSSVariable.COLOR_DANGEROUS]: '#f25042',
  [CSSVariable.COLOR_BORDER]: 'rgb(232 232 232)',
  [CSSVariable.COLOR_CONTROL_NEUTRAL]: 'rgb(180 180 180)',
  [CSSVariable.COLOR_DISABLED_SHADOW]: 'rgb(214 214 214)',
  [CSSVariable.COLOR_SURFACE_SHADOW]: 'rgb(232 232 232)',

  [CSSVariable.TEXT_SIZE_TITLE]: '18px',
  [CSSVariable.TEXT_SIZE_LARGE]: '16px',
  [CSSVariable.TEXT_SIZE_NORMAL]: '14px',
  [CSSVariable.TEXT_SIZE_SMALL]: '12px',

  [CSSVariable.TEXT_COLOR_PRIMARY]: 'rgb(88 88 88)',
  [CSSVariable.TEXT_COLOR_SECONDARY]: 'rgb(155 155 155)',
  [CSSVariable.TEXT_COLOR_DISABLED]: 'rgb(222 222 222)',

  [CSSVariable.BACKGROUND_DISABLED]: 'rgb(244 244 244)',
  [CSSVariable.BACKGROUND_COLOR_LEVEL_ONE]: 'rgb(44 182 125 / 0.06)',
  [CSSVariable.BACKGROUND_COLOR_LEVEL_TWO]: 'rgb(44 182 125 / 0.1)',
  [CSSVariable.BACKGROUND_COLOR_LEVEL_THREE]: 'rgb(44 182 125 / 0.14)',
  [CSSVariable.BACKGROUND_COLOR_LEVEL_FOUR]: 'rgb(44 182 125 / 0.18)',
  [CSSVariable.BACKGROUND_COLOR_LEVEL_FIVE]: 'rgb(44 182 125 / 0.22)',

  [CSSVariable.BORDER_RADIUS_LIGHT]: '2px',
  [CSSVariable.BORDER_RADIUS_NORMAL]: '4px',
};

const DUOLINGO_FONT_FAMILY =
  "'Nunito', 'Varela Round', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  html {
    height: 100%;
    overscroll-behavior-x: none;

    ${Object.keys(CSS_VARIABLE_MAP_VALUE)
      .map(
        (variable) =>
          `${variable.match(/^var\((.+)\)$/)![1]}: ${
            CSS_VARIABLE_MAP_VALUE[variable]
          };`,
      )
      .join('\n')}

    accent-color: ${CSSVariable.COLOR_PRIMARY};
  }

  body {
    height: 100%;

    overscroll-behavior: contain;
    overscroll-behavior-x: none;
    overflow: hidden;

    margin: 0;
    padding: 0;

    /* 全局字体基线，避免页面局部逐个声明 Duolingo 字体。 */
    font-family: ${DUOLINGO_FONT_FAMILY};
  }

  button,
  input,
  textarea,
  select {
    font-family: inherit;
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

  input,
  textarea,
  [contenteditable='true'],
  [contenteditable='plaintext-only'] {
    -webkit-user-select: text;
    user-select: text;
    -webkit-touch-callout: default;
  }

  img,
  svg {
    -webkit-user-drag: none;
  }

  #root {
    height: 100%;
  }
`;
