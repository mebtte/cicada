import { createGlobalStyle } from 'styled-components';

export enum CSSVariable {
  COLOR_PRIMARY = 'var(--color-primary)',

  TEXT_SIZE_NORMAL = 'var(--text-size-normal)',
  TEXT_SIZE_MEDIUM = 'var(--text-size-medium)',
  TEXT_SIZE_SMALL = 'var(--text-size-small)',

  TEXT_COLOR_PRIMARY = 'var(--text-color-primary)',
  TEXT_COLOR_SECONDARY = 'var(--text-color-secondary)',
  TEXT_COLOR_DISABLED = 'var(--text-color-disabled)',

  BACKGROUND_DISABLED = 'var(--background-disabled)',
}

const CSS_VARIABLE_MAP_VALUE: Record<CSSVariable, string> = {
  [CSSVariable.COLOR_PRIMARY]: 'rgb(49 194 124)',

  [CSSVariable.TEXT_SIZE_NORMAL]: '16px',
  [CSSVariable.TEXT_SIZE_MEDIUM]: '14px',
  [CSSVariable.TEXT_SIZE_SMALL]: '12px',

  [CSSVariable.TEXT_COLOR_PRIMARY]: 'rgb(88 88 88)',
  [CSSVariable.TEXT_COLOR_SECONDARY]: 'rgb(155 155 155)',
  [CSSVariable.TEXT_COLOR_DISABLED]: 'rgb(222 222 222)',

  [CSSVariable.BACKGROUND_DISABLED]: 'rgb(244 244 244)',
};

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html {
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
    overscroll-behavior-y: contain;
    overflow: hidden;

    margin: 0;
    padding: 0;
  }
`;
