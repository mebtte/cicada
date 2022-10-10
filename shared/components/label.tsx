import { ForwardedRef, forwardRef, HtmlHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { CSSVariable } from '../global_style';

const Style = styled.label<{ active: boolean; disabled: boolean }>`
  transition: 300ms ease-in-out;

  > .label {
    margin-bottom: 5px;

    font-size: 12px;
    transition: inherit;
  }

  ${({ active, disabled }) => css`
    > .label {
      color: ${disabled
        ? CSSVariable.TEXT_COLOR_DISABLED
        : active
        ? CSSVariable.COLOR_PRIMARY
        : CSSVariable.TEXT_COLOR_PRIMARY};
    }
  `}
`;
type Props = HtmlHTMLAttributes<HTMLLabelElement> & {
  label?: string;
  disabled?: boolean;
  active?: boolean;
};

function Label(
  { label, active = false, disabled = false, children, ...props }: Props,
  ref: ForwardedRef<HTMLLabelElement>,
) {
  return (
    <Style {...props} active={active} disabled={disabled} ref={ref}>
      {label ? <div className="label">{label}</div> : null}
      {children}
    </Style>
  );
}

export default forwardRef<HTMLLabelElement, Props>(Label);
