import { ForwardedRef, forwardRef, HtmlHTMLAttributes, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { CSSVariable } from '../global_style';
import ellipsis from '../style/ellipsis';

const Style = styled.label<{ active: boolean; disabled: boolean }>`
  transition: 300ms ease-in-out;

  > .top {
    margin-bottom: 5px;

    display: flex;
    align-items: center;

    transition: inherit;

    &:empty {
      display: none;
    }

    > .label {
      flex: 1;
      min-width: 0;

      font-size: 12px;
      transition: inherit;
      ${ellipsis}
    }
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
  addon?: ReactNode;
};

function Label(
  { label, active = false, disabled = false, addon, children, ...props }: Props,
  ref: ForwardedRef<HTMLLabelElement>,
) {
  return (
    <Style {...props} active={active} disabled={disabled} ref={ref}>
      <div className="top">
        {label ? <div className="label">{label}</div> : null}
        {addon}
      </div>
      {children}
    </Style>
  );
}

export default forwardRef<HTMLLabelElement, Props>(Label);
