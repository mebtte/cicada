import {
  ForwardedRef,
  forwardRef,
  HtmlHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  useImperativeHandle,
  useRef,
} from 'react';
import styled from 'styled-components';
import { ComponentSize } from '../constants/style';
import { CSSVariable } from '../global_style';
import Label from './label';

const Input = styled.input`
  padding: 0 10px;
  width: 100%;
  height: ${ComponentSize.NORMAL}px;

  background-color: #fff;
  border-radius: 0;
  border: 1px solid ${CSSVariable.COLOR_BORDER};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: 14px;
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

type Ref = {
  root: HTMLLabelElement;
  input: HTMLInputElement;
};
type Props = {
  label?: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
  disabled?: boolean;
  addon?: ReactNode;
} & HtmlHTMLAttributes<HTMLLabelElement>;

function Wrapper(
  { label, inputProps, disabled = false, addon, ...props }: Props,
  ref: ForwardedRef<Ref>,
) {
  const rootRef = useRef<HTMLLabelElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    root: rootRef.current!,
    input: inputRef.current!,
  }));

  return (
    <Label {...props} ref={rootRef} label={label} addon={addon}>
      <Input {...inputProps} disabled={disabled} ref={inputRef} />
    </Label>
  );
}

export default forwardRef<Ref, Props>(Wrapper);
