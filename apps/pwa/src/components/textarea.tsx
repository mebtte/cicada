import { ForwardedRef, forwardRef, TextareaHTMLAttributes } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '../global_style';

const Textarea = styled.textarea`
  display: block;
  padding: 10px;
  width: 100%;

  border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
  border: 1px solid ${CSSVariable.COLOR_BORDER};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
  outline: none;
  transition: inherit;
  resize: none;

  &:focus {
    border-color: ${CSSVariable.COLOR_PRIMARY};
  }

  &:disabled {
    border-color: ${CSSVariable.TEXT_COLOR_DISABLED};
    background: ${CSSVariable.BACKGROUND_DISABLED};
    cursor: not-allowed;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }
`;

type Props = {
  disabled?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

function Wrapper(
  { disabled = false, ...props }: Props,
  ref: ForwardedRef<HTMLTextAreaElement>,
) {
  return <Textarea {...props} disabled={disabled} ref={ref} />;
}

export default forwardRef<HTMLTextAreaElement, Props>(Wrapper);
