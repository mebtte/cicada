import {
  FocusEventHandler,
  ForwardedRef,
  forwardRef,
  HtmlHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { CSSVariable } from '../global_style';
import useEvent from '../utils/use_event';
import Label from './label';

const Textarea = styled.textarea`
  display: block;
  padding: 10px;
  width: 100%;

  border-radius: 4px;
  border: 1px solid ${CSSVariable.COLOR_BORDER};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: 14px;
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

type Ref = {
  root: HTMLDivElement;
  textarea: HTMLTextAreaElement;
};
type Props = {
  label?: string;
  textareaProps: TextareaHTMLAttributes<HTMLTextAreaElement>;
  disabled?: boolean;
  addon?: ReactNode;
} & HtmlHTMLAttributes<HTMLDivElement>;

function Wrapper(
  { label, textareaProps, disabled = false, addon, ...props }: Props,
  ref: ForwardedRef<Ref>,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [active, setActive] = useState(false);
  const onFocus: FocusEventHandler<HTMLTextAreaElement> = useEvent((e) => {
    setActive(true);
    return textareaProps.onFocus && textareaProps.onFocus(e);
  });
  const onBlur: FocusEventHandler<HTMLTextAreaElement> = useEvent((e) => {
    setActive(false);
    return textareaProps.onBlur && textareaProps.onBlur(e);
  });

  useImperativeHandle(ref, () => ({
    root: rootRef.current!,
    textarea: textareaRef.current!,
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
      <Textarea
        {...textareaProps}
        disabled={disabled}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={textareaRef}
      />
    </Label>
  );
}

export default forwardRef<Ref, Props>(Wrapper);
