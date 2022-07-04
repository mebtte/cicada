import {
  forwardRef,
  HtmlHTMLAttributes,
  InputHTMLAttributes,
  useImperativeHandle,
  useRef,
} from 'react';
import styled from 'styled-components';
import { CSSVariable } from '../global_style';

const Style = styled.div`
  --transiton-duration: 300ms ease-in-out;

  display: flex;
  flex-direction: column-reverse;
  gap: 5px;

  > input {
    padding: 10px;

    border-radius: 4px;
    border: 1px solid ${CSSVariable.TEXT_COLOR_SECONDARY};
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
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
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    transition: color var(--transiton-duration);
  }
`;

type Ref = {
  root: HTMLDivElement;
  input: HTMLInputElement;
};
type Props = {
  label: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
} & HtmlHTMLAttributes<HTMLDivElement>;

// eslint-disable-next-line react/display-name
const Input = forwardRef<Ref, Props>(({ label, inputProps, ...props }, ref) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    root: rootRef.current!,
    input: inputRef.current!,
  }));

  return (
    <Style {...props} ref={rootRef}>
      <input {...inputProps} ref={inputRef} />
      {label ? <div className="label">{label}</div> : null}
    </Style>
  );
});

export default Input;
