import {
  ButtonHTMLAttributes,
  ForwardedRef,
  MouseEvent as ReactMouseEvent,
  forwardRef,
} from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';

const Root = styled.button<{ $checked: boolean }>`
  position: relative;
  flex: 0 0 auto;
  width: 58px;
  height: 34px;
  padding: 3px;
  border: 2px solid
    ${({ $checked }) =>
      $checked
        ? CSSVariable.COLOR_PRIMARY_ACTIVE
        : CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 999px;
  background: ${({ $checked }) =>
    $checked ? CSSVariable.COLOR_PRIMARY : '#fff'};
  box-shadow: 0 4px 0
    ${({ $checked }) =>
      $checked
        ? CSSVariable.COLOR_PRIMARY_ACTIVE
        : CSSVariable.COLOR_NEUTRAL_SHADOW};
  cursor: pointer;
  transition:
    transform 150ms ease-out,
    background 150ms ease,
    box-shadow 150ms ease,
    filter 120ms;

  &:not(:disabled):hover {
    filter: brightness(1.04);
  }

  &:not(:disabled):active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    filter: saturate(0.45);
  }

  &:focus-visible {
    outline: 3px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 3px;
  }
`;

const Thumb = styled.span<{ $checked: boolean }>`
  display: block;
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  border: 2px solid
    ${({ $checked }) =>
      $checked
        ? CSSVariable.COLOR_PRIMARY_ACTIVE
        : CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 0
    ${({ $checked }) =>
      $checked
        ? CSSVariable.COLOR_PRIMARY_ACTIVE
        : CSSVariable.COLOR_NEUTRAL_SHADOW};
  transform: translateX(${({ $checked }) => ($checked ? '24px' : '0')});
  transition:
    transform 160ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 150ms ease,
    box-shadow 150ms ease;
`;

export interface SwitchProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'aria-checked' | 'children' | 'role' | 'type'
  > {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function Switch(
  {
    checked,
    disabled,
    onCheckedChange,
    onClick,
    ...props
  }: SwitchProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented || disabled) {
      return;
    }

    onCheckedChange?.(!checked);
  };

  return (
    <Root
      {...props}
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      $checked={checked}
      disabled={disabled}
      onClick={handleClick}
    >
      <Thumb $checked={checked} />
    </Root>
  );
}

export default forwardRef<HTMLButtonElement, SwitchProps>(Switch);
