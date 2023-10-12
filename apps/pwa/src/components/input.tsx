import {
  ForwardedRef,
  forwardRef,
  InputHTMLAttributes,
  useImperativeHandle,
  useRef,
} from 'react';
import styled from 'styled-components';
import { ComponentSize } from '../constants/style';
import { CSSVariable } from '../global_style';

const Input = styled.input`
  padding: 0 10px;
  width: 100%;
  height: ${ComponentSize.NORMAL}px;

  background-color: #fff;
  border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
  border: 1px solid ${CSSVariable.COLOR_BORDER};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
  outline: none;
  transition: inherit;
  -webkit-tap-highlight-color: transparent;

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
} & InputHTMLAttributes<HTMLInputElement>;

function Wrapper(
  { disabled = false, ...props }: Props,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => inputRef.current!);

  return <Input {...props} disabled={disabled} ref={inputRef} />;
}

export default forwardRef<HTMLInputElement, Props>(Wrapper);
