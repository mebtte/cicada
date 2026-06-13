import { css } from 'styled-components';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from './theme';

export type ControlSize = 'sm' | 'md' | 'lg';

export const CONTROL_SIZE: Record<
  ControlSize,
  {
    height: number;
    font: number;
    radius: number;
    shadow: number;
    inputPadding: string;
    textareaPadding: string;
  }
> = {
  sm: {
    height: 34,
    font: 13,
    radius: 10,
    shadow: 3,
    inputPadding: '0 12px',
    textareaPadding: '8px 12px',
  },
  md: {
    height: 44,
    font: 15,
    radius: 13,
    shadow: 4,
    inputPadding: '0 14px',
    textareaPadding: '10px 14px',
  },
  lg: {
    height: 54,
    font: 17,
    radius: 16,
    shadow: 5,
    inputPadding: '0 18px',
    textareaPadding: '12px 18px',
  },
};

export const CONTROL_FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;
export const CONTROL_PRIMARY_COLOR = `var(${CSS_VAR.colorPrimary})`;
export const CONTROL_TEXT_COLOR = 'rgb(55 55 55)';
export const CONTROL_DISABLED_TEXT_COLOR = 'rgb(145 145 145)';
export const CONTROL_MUTED_TEXT_COLOR = 'rgb(160 160 160)';
export const CONTROL_AFFIX_COLOR = 'rgb(175 175 175)';
export const CONTROL_PLACEHOLDER_COLOR = 'rgb(205 205 205)';
export const CONTROL_ERROR_COLOR = 'rgb(242 80 66)';
export const CONTROL_ERROR_SHADOW = 'rgb(190 46 34)';
export const CONTROL_DISABLED_BACKGROUND = 'rgb(248 248 248)';
export const CONTROL_DISABLED_SHADOW = CSSVariable.COLOR_DISABLED_SHADOW;
export const CONTROL_NEUTRAL_SHADOW = CSSVariable.COLOR_NEUTRAL_SHADOW;

export type ControlSurfaceProps = {
  $size: ControlSize;
  $error: boolean;
  $disabled: boolean;
};

export const controlSurfaceStyles = (focusSelector: string) => css<ControlSurfaceProps>`
  background: #fff;
  border-style: solid;
  border-width: 2px;
  border-color: ${CONTROL_NEUTRAL_SHADOW};

  transition:
    border-color 150ms ease-out,
    box-shadow 150ms ease-out;

  ${({ $size }) => {
    const s = CONTROL_SIZE[$size];
    return css`
      border-radius: ${s.radius}px;
      box-shadow: 0 ${s.shadow}px 0 ${CONTROL_NEUTRAL_SHADOW};
    `;
  }}

  ${focusSelector} {
    border-color: var(${CSS_VAR.colorPrimaryShadow});
    box-shadow: ${({ $size }) =>
      `0 ${CONTROL_SIZE[$size].shadow}px 0 var(${CSS_VAR.colorPrimaryShadow})`};
  }

  ${({ $error, $size }) =>
    $error &&
    css`
      border-color: ${CONTROL_ERROR_SHADOW};
      box-shadow: 0 ${CONTROL_SIZE[$size].shadow}px 0 ${CONTROL_ERROR_SHADOW};

      ${focusSelector} {
        border-color: ${CONTROL_ERROR_SHADOW};
        box-shadow: 0 ${CONTROL_SIZE[$size].shadow}px 0 ${CONTROL_ERROR_SHADOW};
      }
    `}

  ${({ $disabled, $size }) =>
    $disabled &&
    css`
      background: ${CONTROL_DISABLED_BACKGROUND};
      border-color: ${CONTROL_DISABLED_SHADOW};
      box-shadow: 0 ${CONTROL_SIZE[$size].shadow}px 0 ${CONTROL_DISABLED_SHADOW};
      cursor: not-allowed;
    `}
`;

export const controlTextStyles = css<{ $size: ControlSize }>`
  font-family: ${CONTROL_FONT};
  font-weight: 600;
  letter-spacing: 0.2px;
  color: ${CONTROL_TEXT_COLOR};
  font-size: ${({ $size }) => CONTROL_SIZE[$size].font}px;

  @media (pointer: coarse) {
    font-size: ${({ $size }) => Math.max(CONTROL_SIZE[$size].font, 16)}px;
  }
`;

export const controlPlaceholderStyles = css`
  &::placeholder {
    color: ${CONTROL_PLACEHOLDER_COLOR};
    font-weight: 500;
    text-transform: capitalize;
  }
`;

export const controlDisabledTextStyles = css`
  &:disabled {
    cursor: not-allowed;
    color: ${CONTROL_DISABLED_TEXT_COLOR};
  }
`;
