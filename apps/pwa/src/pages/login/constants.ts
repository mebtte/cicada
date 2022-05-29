import { css } from 'styled-components';

export enum Step {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
}
export const STEPS = Object.values(Step);

export const panelCSS = css<{ visible: 0 | 1 }>`
  padding: 30px;
  width: ${100 / STEPS.length}%;

  transition: opacity ease-in-out 300ms;

  ${({ visible }) => css`
    opacity: ${visible ? 1 : 0};
  `}
`;
