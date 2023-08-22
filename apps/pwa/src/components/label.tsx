import upperCaseFirstLetter from '@/style/capitalize';
import { ForwardedRef, forwardRef, HtmlHTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '../global_style';

const Style = styled.label`
  > .top {
    margin-bottom: 5px;

    display: flex;
    align-items: center;

    transition: inherit;
    user-select: none;

    &:empty {
      display: none;
    }

    > .label {
      flex: 1;
      min-width: 0;

      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      font-size: 12px;
      transition: inherit;
      ${upperCaseFirstLetter}
    }
  }

  &:focus-within {
    > .top {
      > .label {
        color: ${CSSVariable.COLOR_PRIMARY};
      }
    }
  }

  &:disabled {
    > .top {
      > .label {
        color: ${CSSVariable.TEXT_COLOR_DISABLED} !important;
      }
    }
  }
`;
type Props = HtmlHTMLAttributes<HTMLLabelElement> & {
  label?: string;
  addon?: ReactNode;
};

function Label(
  { label, addon, children, ...props }: Props,
  ref: ForwardedRef<HTMLLabelElement>,
) {
  return (
    <Style {...props} ref={ref}>
      <div className="top">
        {label ? <div className="label">{label}</div> : null}
        {addon}
      </div>
      {children}
    </Style>
  );
}

export default forwardRef<HTMLLabelElement, Props>(Label);
