import { createGlobalStyle } from 'styled-components';

export enum CSSVariable {
  COLOR_PRIMARY = '--color-primary',

  TEXT_COLOR_PRIMARY = '--text-color-primary',
  TEXT_COLOR_SECONDARY = '--text-color-secondary',
}

const CSS_VARIABLE_MAP_VALUE: Record<CSSVariable, string> = {
  [CSSVariable.COLOR_PRIMARY]: 'rgb(49 194 124)',
  [CSSVariable.TEXT_COLOR_PRIMARY]: 'rgb(88 88 88)',
  [CSSVariable.TEXT_COLOR_SECONDARY]: 'rgb(155 155 155)',
};

export function getCSSVariable(v: CSSVariable) {
  return `var(${v})`;
}

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html {
    font-family: Helvetica, Tahoma, Arial, STXihei, '华文细黑', 'Microsoft YaHei',
      '微软雅黑', SimSun, '宋体', Heiti, '黑体', sans-serif;

    ${Object.keys(CSS_VARIABLE_MAP_VALUE).map(
      (variable) => `${variable}: ${CSS_VARIABLE_MAP_VALUE[variable]};`,
    )}
  }

  body {
    overscroll-behavior-y: contain;
    overflow: hidden;
  }
`;
