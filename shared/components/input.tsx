import {
  ForwardedRef,
  forwardRef,
  HtmlHTMLAttributes,
  InputHTMLAttributes,
  useImperativeHandle,
  useRef,
} from 'react';
import styled, { css } from 'styled-components';
import { ComponentSize } from '../constants/style';
import { CSSVariable } from '../global_style';

const Style = styled.div<{ disabled: boolean }>`
  --transiton-duration: 300ms ease-in-out;

  display: flex;
  flex-direction: column-reverse;
  gap: 5px;

  > input {
    padding: 0 10px;
    height: ${ComponentSize.NORMAL}px;

    border-radius: 4px;
    border: 1px solid rgb(222 222 222);
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-size: 14px;
    outline: none;
    transition: border-color var(--transiton-duration);

    &:focus {
      border-color: ${CSSVariable.COLOR_PRIMARY};

      + .label {
        color: ${CSSVariable.COLOR_PRIMARY};
      }
    }

    &:disabled {
      border-color: ${CSSVariable.TEXT_COLOR_DISABLED};
      background: ${CSSVariable.BACKGROUND_DISABLED};
      cursor: not-allowed;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }
  }

  > .label {
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    transition: color var(--transiton-duration);
  }

  ${({ disabled }) => css`
    > .label {
      color: ${disabled
        ? CSSVariable.TEXT_COLOR_DISABLED
        : CSSVariable.TEXT_COLOR_PRIMARY};
    }
  `}
`;

type Ref = {
  root: HTMLDivElement;
  input: HTMLInputElement;
};
type Props = {
  label?: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
  disabled?: boolean;
} & HtmlHTMLAttributes<HTMLDivElement>;

function Input(
  { label, inputProps, disabled = false, ...props }: Props,
  ref: ForwardedRef<Ref>,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    root: rootRef.current!,
    input: inputRef.current!,
  }));

  return (
    <Style {...props} ref={rootRef} disabled={disabled}>
      <input {...inputProps} disabled={disabled} ref={inputRef} />
      {label ? <div className="label">{label}</div> : null}
    </Style>
  );
}

export default forwardRef<Ref, Props>(Input);
