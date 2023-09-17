import { createGlobalStyle } from 'styled-components';

export enum CSSVariable {
  COLOR_PRIMARY = 'var(--color-primary)',
  COLOR_PRIMARY_DISABLED = 'var(--color-primary-disabled)',
  COLOR_PRIMARY_ACTIVE = 'var(--color-primary-active)',
  COLOR_DANGEROUS = 'var(--color-dangerous)',
  COLOR_BORDER = 'var(--color-border)',

  TEXT_SIZE_NORMAL = 'var(--text-size-normal)',
  TEXT_SIZE_MEDIUM = 'var(--text-size-medium)',
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
}

const CSS_VARIABLE_MAP_VALUE: Record<CSSVariable, string> = {
  [CSSVariable.COLOR_PRIMARY]: 'rgb(44 182 125)',
  [CSSVariable.COLOR_PRIMARY_DISABLED]: '#7bd5b0',
  [CSSVariable.COLOR_PRIMARY_ACTIVE]: '#1d8b5e',
  [CSSVariable.COLOR_DANGEROUS]: '#f25042',
  [CSSVariable.COLOR_BORDER]: 'rgb(232 232 232)',

  [CSSVariable.TEXT_SIZE_NORMAL]: '16px',
  [CSSVariable.TEXT_SIZE_MEDIUM]: '14px',
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
    overscroll-behavior: contain;
    overflow: hidden;

    margin: 0;
    padding: 0;
  }
`;
