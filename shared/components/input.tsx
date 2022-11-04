import {
  FocusEventHandler,
  ForwardedRef,
  forwardRef,
  HtmlHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { ComponentSize } from '../constants/style';
import { CSSVariable } from '../global_style';
import useEvent from '../utils/use_event';
import Label from './label';

const Input = styled.input`
  padding: 0 10px;
  width: 100%;
  height: ${ComponentSize.NORMAL}px;

  border: 1px solid ${CSSVariable.COLOR_BORDER};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: 14px;
  outline: none;
  transition: inherit;

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
  root: HTMLDivElement;
  input: HTMLInputElement;
};
type Props = {
  label?: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
  disabled?: boolean;
  addon?: ReactNode;
} & HtmlHTMLAttributes<HTMLDivElement>;

function Wrapper(
  { label, inputProps, disabled = false, addon, ...props }: Props,
  ref: ForwardedRef<Ref>,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [active, setActive] = useState(false);
  const onFocus: FocusEventHandler<HTMLInputElement> = useEvent((e) => {
    setActive(true);
    return inputProps.onFocus && inputProps.onFocus(e);
  });
  const onBlur: FocusEventHandler<HTMLInputElement> = useEvent((e) => {
    setActive(false);
    return inputProps.onBlur && inputProps.onBlur(e);
  });

  useImperativeHandle(ref, () => ({
    root: rootRef.current!,
    input: inputRef.current!,
  }));

  return (
    <Label
      {...props}
      ref={rootRef}
      active={active}
      disabled={disabled}
      label={label}
      addon={addon}
    >
      <Input
        {...inputProps}
        disabled={disabled}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={inputRef}
      />
    </Label>
  );
}

export default forwardRef<Ref, Props>(Wrapper);
