import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import {
  ForwardedRef,
  LabelHTMLAttributes,
  ReactNode,
  forwardRef,
} from 'react';
import styled from 'styled-components';

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

const Root = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  transition: inherit;

  > .top {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    transition: inherit;
    user-select: none;

    &:empty {
      display: none;
    }

    > .text {
      flex: 1;
      min-width: 0;
      font-family: ${FONT};
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.2px;
      color: rgb(66 66 66);
      ${upperCaseFirstLetter}
    }
  }
`;

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  label?: ReactNode;
  addon?: ReactNode;
}

function Label(
  { label, children, addon, ...props }: LabelProps,
  ref: ForwardedRef<HTMLLabelElement>,
) {
  const hasWrappedContent = label !== undefined || addon !== undefined;
  const text = hasWrappedContent ? label : children;
  const content = hasWrappedContent ? children : null;

  return (
    <Root {...props} ref={ref}>
      <div className="top">
        {text ? <span className="text">{text}</span> : null}
        {addon}
      </div>
      {content}
    </Root>
  );
}

export default forwardRef<HTMLLabelElement, LabelProps>(Label);
